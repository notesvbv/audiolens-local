"""
audiolens — app.py
huggingface space backend (zerogpu + gradio native api)

api endpoints (via gradio):
    /call/classify   — document type classification (dit-base)
    /call/ocr        — text extraction (easyocr)
    /call/speak      — text to speech (kokoro)
    /call/health     — check if space is warm

the pwa calls these using the gradio js client (@gradio/client)
or via gradio's rest api. each function decorated with @spaces.GPU
gets a gpu allocation only for the duration of that call.

llm extraction (gemini) is called directly from the pwa — not here.
"""

import io
import warnings
warnings.filterwarnings('ignore')

import numpy as np
import cv2
from PIL import Image

import torch
import spaces
import gradio as gr

from j2_preprocess import preprocess


def get_device():
    """picks the best available device at call time.
    on hf, cuda is only available inside @spaces.GPU functions.
    on mac, mps is always available. falls back to cpu."""
    if torch.cuda.is_available():
        return 'cuda'
    if torch.backends.mps.is_available():
        return 'mps'
    return 'cpu'


# ============================================================
# -- dit class mapping --
# ============================================================

# dit maps its 16 rvl-cdip classes to audiolens categories
# indices must match the 9 classes we selected in j1
DIT_CLASS_MAP = {
    0:  'letter',
    1:  'form',
    2:  'email',
    3:  'handwritten',
    4:  'advertisement',
    7:  'specification',
    9:  'news_article',
    10: 'budget',
    11: 'invoice',
}
SELECTED_RVL_IDX = list(DIT_CLASS_MAP.keys())


# ============================================================
# -- model loading (runs once at startup, cpu ram) --
# ============================================================

print('loading models...')

# -- classifier: dit-base --
from transformers import AutoImageProcessor, AutoModelForImageClassification

dit_processor = AutoImageProcessor.from_pretrained('microsoft/dit-base-finetuned-rvlcdip')
dit_model     = AutoModelForImageClassification.from_pretrained('microsoft/dit-base-finetuned-rvlcdip')
dit_model.eval()
print('dit-base loaded.')

# -- ocr: easyocr (lazy-init on first call, runs on cpu to save gpu quota) --
ocr_reader = None
print('easyocr will lazy-init on first ocr request (cpu).')

# -- tts: kokoro --
import soundfile as sf
from kokoro import KPipeline
kokoro_pipeline = KPipeline(lang_code='b')   # b = british english
print('kokoro loaded.')

print('all models ready.')


# ============================================================
# -- helpers --
# ============================================================

def pil_to_cv2(pil_image):
    """converts a pil rgb image to a bgr numpy array for opencv."""
    rgb = np.array(pil_image)
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


# -- endpoint section: ocr --
# preprocesses the image then runs easyocr — both on cpu.
# saves gpu quota for classify and tts only.

@spaces.GPU
def classify_fn(image):
    """
    classifies a document image into one of 9 categories.
    called via gradio api: /call/classify

    input:  pil image (gradio Image component with type="pil")
    output: json dict with doc_type and confidence
    """
    if image is None:
        return {'error': 'no image provided'}

    try:
        device = get_device()
        dit_model.to(device)
        inputs = dit_processor(images=image, return_tensors='pt').to(device)

        with torch.no_grad():
            logits = dit_model(**inputs).logits

        # slice to our 9 selected classes and get the winner
        selected_logits = logits[0, SELECTED_RVL_IDX]
        pred_idx        = selected_logits.argmax().item()
        confidence      = torch.softmax(selected_logits, dim=0)[pred_idx].item()
        doc_type        = DIT_CLASS_MAP[SELECTED_RVL_IDX[pred_idx]]

        return {'doc_type': doc_type, 'confidence': round(confidence, 4)}

    except Exception as e:
        return {'error': str(e)}


def ocr_gpu(clean_image):
    """
    runs easyocr on a preprocessed image.
    runs on cpu to save gpu quota — easyocr is fast enough on cpu.
    lazy-inits on first call.
    """
    global ocr_reader
    if ocr_reader is None:
        import easyocr
        ocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        print('easyocr initialised on cpu.')

    results = ocr_reader.readtext(clean_image, detail=0)
    return ' '.join(results)


def ocr_fn(image):
    """
    extracts text from a document image.
    called via gradio api: /call/ocr

    both preprocessing and ocr run on cpu to save gpu quota.
    easyocr is fast enough on cpu for document-sized images.

    input:  pil image (gradio Image component with type="pil")
    output: extracted text string
    """
    if image is None:
        return 'error: no image provided'

    try:
        # convert pil to cv2 for preprocessing
        cv2_image = pil_to_cv2(image)

        # skip preprocessing — test raw image directly
        # clean = preprocess(cv2_image)

        # ocr inference on cpu
        text = ocr_gpu(cv2_image)
        return text

    except Exception as e:
        return f'error: {str(e)}'


@spaces.GPU(duration=15)
def speak_fn(text, voice):
    """
    converts text to speech using kokoro.
    called via gradio api: /call/speak

    input:  text string + voice id
    output: tuple of (sample_rate, audio_array) for gradio Audio component
    """
    if not text or not text.strip():
        return None

    try:
        if not voice or not voice.strip():
            voice = 'bf_emma'

        chunks = []
        for _, _, audio in kokoro_pipeline(text, voice=voice, speed=1.0):
            chunks.append(audio)

        if not chunks:
            return None

        audio_array = np.concatenate(chunks)

        # gradio Audio expects (sample_rate, numpy_array)
        return (24000, audio_array)

    except Exception as e:
        print(f'tts error: {e}')
        return None


def health_fn():
    """
    simple check to see if the space is warm and models are loaded.
    called via gradio api: /call/health
    """
    return {'status': 'ok', 'models': ['dit-base', 'easyocr', 'kokoro']}


# ============================================================
# -- gradio ui + api --
# ============================================================

with gr.Blocks(title='AudioLens API') as demo:

    gr.Markdown("""
    ## AudioLens API
    **This space provides the AudioLens backend.**
    The AudioLens PWA calls the API endpoints below using the Gradio client.
    """)

    # -- classify tab --
    with gr.Tab('Classify'):
        classify_image = gr.Image(type='pil', label='document image')
        classify_btn   = gr.Button('classify')
        classify_out   = gr.JSON(label='result')
        classify_btn.click(
            fn=classify_fn,
            inputs=classify_image,
            outputs=classify_out,
            api_name='classify',
        )

    # -- ocr tab --
    with gr.Tab('OCR'):
        ocr_image = gr.Image(type='pil', label='document image')
        ocr_btn   = gr.Button('extract text')
        ocr_out   = gr.Textbox(label='extracted text', lines=10)
        ocr_btn.click(
            fn=ocr_fn,
            inputs=ocr_image,
            outputs=ocr_out,
            api_name='ocr',
        )

    # -- speak tab --
    with gr.Tab('Speak'):
        speak_text  = gr.Textbox(label='text to speak', lines=5)
        speak_voice = gr.Textbox(label='voice id', value='bf_emma')
        speak_btn   = gr.Button('generate speech')
        speak_out   = gr.Audio(label='output audio')
        speak_btn.click(
            fn=speak_fn,
            inputs=[speak_text, speak_voice],
            outputs=speak_out,
            api_name='speak',
        )

    # -- health (hidden, api only) --
    health_btn = gr.Button('health', visible=False)
    health_out = gr.JSON(visible=False)
    health_btn.click(
        fn=health_fn,
        inputs=[],
        outputs=health_out,
        api_name='health',
    )

    gr.Markdown("""
    ---
    **API endpoints** (use via [@gradio/client](https://www.gradio.app/guides/getting-started-with-the-js-client)):
    - `/call/classify` — document type classification
    - `/call/ocr` — text extraction with preprocessing
    - `/call/speak` — text to speech
    - `/call/health` — check if space is warm

    _This UI is for testing. The AudioLens PWA calls the API directly._
    """)


# launch — hf spaces handles this automatically
if __name__ == '__main__':
    demo.launch(server_name='0.0.0.0', server_port=7860)