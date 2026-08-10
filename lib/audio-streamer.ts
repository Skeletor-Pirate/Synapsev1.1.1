export class AudioStreamer {
  // ── Recording context (16kHz, for mic input) ──────────────────────────────
  private recordingContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onVolumeChange: ((volume: number) => void) | null = null;

  // ── Playback context (24kHz, for AI audio output) ─────────────────────────
  private playbackContext: AudioContext | null = null;
  private nextPlayTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isPlaybackContextReady = false;

  // ── Ensure playback context is initialized ────────────────────────────────
  private ensurePlaybackContext() {
    if (!this.playbackContext || this.playbackContext.state === 'closed') {
      this.playbackContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.nextPlayTime = 0;
      this.isPlaybackContextReady = true;
    }
    if (this.playbackContext.state === 'suspended') {
      this.playbackContext.resume();
    }
  }

  // ── Start microphone recording ────────────────────────────────────────────
  async startRecording(onAudioData: (base64: string) => void, onVolume?: (volume: number) => void) {
    this.recordingContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    if (!this.recordingContext) {
      throw new Error('Failed to initialize AudioContext');
    }
    this.onVolumeChange = onVolume || null;
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, sampleRate: 16000 }
    });

    if (!this.recordingContext) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      return;
    }

    this.source = this.recordingContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.recordingContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);

      // Volume calculation
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
      const rms = Math.sqrt(sum / inputData.length);
      if (this.onVolumeChange) this.onVolumeChange(rms);

      // PCM16 encode
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      const buffer = new ArrayBuffer(pcm16.length * 2);
      const view = new DataView(buffer);
      for (let i = 0; i < pcm16.length; i++) view.setInt16(i * 2, pcm16[i], true);

      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      onAudioData(btoa(binary));
    };

    this.source.connect(this.processor);
    this.processor.connect(this.recordingContext.destination);
  }

  // ── Stop recording ────────────────────────────────────────────────────────
  stopRecording() {
    if (this.processor) { this.processor.disconnect(); this.processor = null; }
    if (this.source) { this.source.disconnect(); this.source = null; }
    if (this.mediaStream) { this.mediaStream.getTracks().forEach(t => t.stop()); this.mediaStream = null; }
    if (this.recordingContext) { this.recordingContext.close(); this.recordingContext = null; }
    this.stopPlayback();
    if (this.playbackContext) { this.playbackContext.close(); this.playbackContext = null; }
  }

  // ── Enqueue an AI audio chunk for sequential playback ────────────────────
  addAudioChunk(base64: string) {
    this.ensurePlaybackContext();
    if (!this.playbackContext) return;

    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new DataView(buffer);
    for (let i = 0; i < binary.length; i++) view.setUint8(i, binary.charCodeAt(i));

    const pcm16 = new Int16Array(buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
    }

    const audioBuffer = this.playbackContext.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const sourceNode = this.playbackContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(this.playbackContext.destination);

    // ── Strict sequential scheduling: never let chunks overlap ──────────────
    const now = this.playbackContext.currentTime;
    if (this.nextPlayTime < now + 0.05) {
      // If we've fallen behind by more than 50ms, snap back to slightly ahead of now
      this.nextPlayTime = now + 0.05;
    }

    sourceNode.start(this.nextPlayTime);
    this.nextPlayTime += audioBuffer.duration;

    this.activeSources.push(sourceNode);
    sourceNode.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== sourceNode);
    };
  }

  // ── Stop all in-flight audio immediately ─────────────────────────────────
  stopPlayback() {
    this.activeSources.forEach(src => { try { src.stop(); } catch (_) {} });
    this.activeSources = [];
    this.nextPlayTime = 0;
    // Reset playback context clock by closing and nullifying it
    if (this.playbackContext && this.playbackContext.state !== 'closed') {
      this.playbackContext.close().catch(() => {});
      this.playbackContext = null;
    }
  }
}
