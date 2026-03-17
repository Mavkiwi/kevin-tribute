import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Upload, CheckCircle2, Mic, Image, HelpCircle, FileAudio, ImageIcon, MessageSquare, Lightbulb, Square, Send, Loader2 } from 'lucide-react';
import { sendFileToWebhook, sendChunkedFiles, FileCategory } from '@/lib/webhook';
import { compressAudioForTranscription, needsCompression } from '@/lib/audioCompressor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { DurationTimer } from '@/components/DurationTimer';

interface QueuedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  category: FileCategory;
  status: 'pending' | 'uploading' | 'compressing' | 'complete' | 'error';
  progress: number;
  statusMessage?: string;
}

export default function Index() {
  const [yourName, setYourName] = useState('');
  const [department, setDepartment] = useState('');
  const [message, setMessage] = useState('');
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Audio recording hook
  const { isRecording, duration, analyserNode, startRecording, stopRecording, error: recordingError } = useAudioRecorder();

  // Send a file immediately to the webhook (fire-and-forget, don't wait for name)
  const sendFileImmediately = useCallback(async (file: File, category: FileCategory, fileId: string) => {
    setQueuedFiles(prev =>
      prev.map(f => f.id === fileId ? { ...f, status: 'uploading' as const, progress: 10 } : f)
    );

    try {
      // Compress big audio files first
      if (category === 'audio' && needsCompression(file)) {
        setQueuedFiles(prev =>
          prev.map(f => f.id === fileId ? { ...f, status: 'compressing' as const, statusMessage: 'Compressing audio...', progress: 0 } : f)
        );

        const result = await compressAudioForTranscription(file, (progress) => {
          setQueuedFiles(prev =>
            prev.map(f => f.id === fileId ? { ...f, progress: Math.round(progress.percent * 0.5), statusMessage: progress.message } : f)
          );
        });

        setQueuedFiles(prev =>
          prev.map(f => f.id === fileId ? { ...f, status: 'uploading' as const, statusMessage: 'Uploading...', progress: 50 } : f)
        );

        await sendChunkedFiles(result.files, 'audio', yourName || 'Recording in progress', department, message, result.recordingId, (chunkIndex, totalChunks) => {
          setQueuedFiles(prev =>
            prev.map(f => f.id === fileId ? { ...f, progress: 50 + Math.round(((chunkIndex + 1) / totalChunks) * 50) } : f)
          );
        });

        toast.success(`Recording saved! (compressed from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.totalCompressedSize)})`);
      } else {
        // Normal upload - simulate progress
        const interval = setInterval(() => {
          setQueuedFiles(prev =>
            prev.map(f => f.id === fileId && f.status === 'uploading' ? { ...f, progress: Math.min(f.progress + 15, 90) } : f)
          );
        }, 150);

        await sendFileToWebhook(file, category, yourName || 'Recording in progress', department, message);
        clearInterval(interval);
        toast.success('Recording saved!');
      }

      setQueuedFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, status: 'complete' as const, progress: 100, statusMessage: undefined } : f)
      );
    } catch (error) {
      console.error('Upload error:', error);
      setQueuedFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, status: 'error' as const, progress: 0, statusMessage: undefined } : f)
      );
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [yourName, department, message]);

  // Add files to queue AND send immediately
  const addFilesToQueue = useCallback((files: FileList | null, category: FileCategory) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const fileId = crypto.randomUUID();
      const newFile: QueuedFile = {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        category,
        status: 'uploading',
        progress: 0,
      };
      setQueuedFiles(prev => [...prev, newFile]);
      // Send immediately - don't wait for name
      sendFileImmediately(file, category, fileId);
    });
  }, [sendFileImmediately]);

  // Handle recording stop - send immediately
  const handleRecordingStop = useCallback(async () => {
    const audioBlob = await stopRecording();
    if (!audioBlob) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = new File([audioBlob], `kevin-tribute-recording-${timestamp}.webm`, { type: 'audio/webm' });
    const fileId = crypto.randomUUID();

    const newFile: QueuedFile = {
      id: fileId,
      file,
      name: file.name,
      size: file.size,
      category: 'audio',
      status: 'uploading',
      progress: 0,
    };

    setQueuedFiles(prev => [...prev, newFile]);
    toast.info('Sending recording...');
    // Send immediately
    sendFileImmediately(file, 'audio', fileId);
  }, [stopRecording, sendFileImmediately]);

  // Handle record button click
  const handleRecordClick = useCallback(async () => {
    if (isRecording) {
      await handleRecordingStop();
    } else {
      await startRecording();
    }
  }, [isRecording, handleRecordingStop, startRecording]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // "Send" button - sends the contributor details to tag the recordings
  const handleSend = useCallback(async () => {
    if (!yourName.trim()) {
      toast.error('Please enter your name');
      nameInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      // Send a metadata-only call so the name/dept/message gets logged
      const metadata = {
        type: 'kevin_tribute',
        category: 'metadata' as FileCategory,
        timestamp: new Date().toISOString(),
        file_name: 'contributor-details',
        file_type: 'metadata',
        file_size: 0,
        contributor_name: yourName,
        department: department || 'Not specified',
        message: message || '',
      };

      const formData = new FormData();
      // Create a tiny placeholder so the webhook doesn't reject
      const placeholder = new Blob(['details'], { type: 'text/plain' });
      formData.append('attachment', placeholder, 'contributor-details.txt');
      formData.append('metadata', JSON.stringify(metadata));

      await fetch('https://plex.app.n8n.cloud/webhook/kevin-tribute', {
        method: 'POST',
        body: formData,
      });

      setHasSubmitted(true);
      toast.success('Thank you! Your contribution has been sent.');
    } catch {
      toast.error('Something went wrong, but your recording is safe.');
    }
    setIsSubmitting(false);
  }, [yourName, department, message]);

  // Remove file from queue
  const removeFromQueue = useCallback((id: string) => {
    setQueuedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAudio(false);
    addFilesToQueue(e.dataTransfer.files, 'audio');
  }, [addFilesToQueue]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAudio(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingAudio(false);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const pendingCount = queuedFiles.filter(f => f.status === 'pending').length;
  const completedCount = queuedFiles.filter(f => f.status === 'complete').length;
  const audioFiles = queuedFiles.filter(f => f.category === 'audio');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-orange-950/20 to-slate-900">
      {/* OfficeMax Rubber Band Ball */}
      <div className="flex justify-center py-6 bg-gradient-to-b from-orange-900/30 to-transparent">
        <img
          src="/officemaxball.jpeg"
          alt="OfficeMax Rubber Band Ball"
          className="w-24 h-24 object-contain drop-shadow-lg"
        />
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="text-center mb-8">
          <img src="/kevin.png" alt="Kevin" className="w-24 h-24 mx-auto mb-4 rounded-full object-cover" />
          <h1 className="text-3xl font-semibold text-white mb-2">For Kevin</h1>
          <p className="text-slate-300 text-lg">Celebrating a Legend's Retirement</p>
        </div>

        {/* What & Why Section */}
        <Card className="mb-6 bg-slate-800/50 border-orange-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-400" />
              What We're Creating
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-4">
            <p>
              We're gathering stories, memories, and photos to create a special coffee-table book
              celebrating Kevin's incredible career at OfficeMax. Share your favourite moments,
              funny stories, or heartfelt messages.
            </p>
            <div className="flex items-center gap-2 p-3 bg-orange-900/30 rounded-lg border border-orange-700">
              <MessageSquare className="w-5 h-5 text-orange-400 shrink-0" />
              <p className="text-orange-300 font-medium">
                "This Is Your OfficeMax Life" - A tribute to Kevin
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How To Section */}
        <Accordion type="multiple" className="mb-6 space-y-2">
          <AccordionItem value="how-to" className="border-orange-900/50 bg-slate-800/30 rounded-lg px-4">
            <AccordionTrigger className="text-white hover:text-orange-300">
              <span className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                How to Record & Upload (tap to expand)
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-slate-300">
              <div className="space-y-4 pt-2 pb-4">
                <div className="flex items-start gap-3">
                  <Mic className="w-5 h-5 text-orange-400 mt-1 shrink-0" />
                  <div>
                    <p className="font-medium text-white">Voice Recording:</p>
                    <p>Use the "Record Now" button below, or upload from your phone</p>
                    <p className="text-sm text-slate-400">iPhone: Voice Memos | Android: Recorder app</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-orange-400 mt-1 shrink-0" />
                  <div>
                    <p className="font-medium text-white">Tips:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Find a quiet spot - your car works great!</li>
                      <li>Just chat like you're talking to a friend</li>
                      <li>Don't worry about being perfect - just be yourself!</li>
                      <li>Any length is fine - 1 minute or 10 minutes</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Image className="w-5 h-5 text-orange-400 mt-1 shrink-0" />
                  <div>
                    <p className="font-medium text-white">Photos:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Team events, work trips, celebrations</li>
                      <li>Any photos with Kevin over the years</li>
                      <li>Higher resolution is better for the book</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Thought Starter Questions */}
          <AccordionItem value="thought-starters" className="border-orange-900/50 bg-slate-800/30 rounded-lg px-4">
            <AccordionTrigger className="text-white hover:text-orange-300">
              <span className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Thought Starter Questions (tap to expand)
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-slate-300">
              <div className="space-y-4 pt-2 pb-4">
                <p className="text-sm text-slate-400 mb-3">
                  Not sure what to say? Pick one or two of these to get started:
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 font-bold">1.</span>
                    <span>What's your favourite memory of working with Kevin?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 font-bold">2.</span>
                    <span>What's something Kevin taught you (about work or life)?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 font-bold">3.</span>
                    <span>Describe Kevin in three words - and why those words?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 font-bold">4.</span>
                    <span>What's a funny story or moment involving Kevin?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 font-bold">5.</span>
                    <span>How has Kevin made a difference to you or the team?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 font-bold">6.</span>
                    <span>What will you miss most about working with Kevin?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 font-bold">7.</span>
                    <span>Is there a "Kevin-ism" or phrase he's known for saying?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 font-bold">8.</span>
                    <span>What advice would you give Kevin for retirement?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 font-bold">9.</span>
                    <span>What's something about Kevin that might surprise people?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 font-bold">10.</span>
                    <span>If Kevin was a superhero, what would his superpower be?</span>
                  </li>
                </ul>
                <p className="text-xs text-slate-500 mt-4 italic">
                  Remember: There's no wrong answer. Just speak from the heart!
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Upload Area with Tabs */}
        <Card className="mb-6 bg-slate-800/50 border-orange-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-400" />
              Share Your Contribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="record" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                <TabsTrigger value="record" className="data-[state=active]:bg-orange-600">
                  <Mic className="w-4 h-4 mr-2" />
                  Record Now
                </TabsTrigger>
                <TabsTrigger value="upload" className="data-[state=active]:bg-orange-600">
                  <FileAudio className="w-4 h-4 mr-2" />
                  Upload Audio
                </TabsTrigger>
              </TabsList>

              {/* Record Now Tab */}
              <TabsContent value="record" className="mt-4">
                <div className="border-2 border-dashed rounded-xl p-6 text-center border-slate-600">
                  <AudioVisualizer
                    analyserNode={analyserNode}
                    isRecording={isRecording}
                    color="#f97316"
                  />

                  <DurationTimer duration={duration} isRecording={isRecording} />

                  <button
                    onClick={handleRecordClick}
                    className={`
                      relative w-20 h-20 rounded-full mx-auto mt-4 mb-2
                      flex items-center justify-center
                      transition-all duration-300 ease-out
                      focus:outline-none focus:ring-4 focus:ring-white/20
                      ${isRecording
                        ? 'bg-red-500 animate-pulse'
                        : 'bg-orange-600 hover:bg-orange-500 hover:scale-105 active:scale-95'
                      }
                    `}
                  >
                    {isRecording ? (
                      <Square className="w-8 h-8 text-white fill-white" />
                    ) : (
                      <Mic className="w-10 h-10 text-white" />
                    )}
                    {isRecording && (
                      <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                    )}
                  </button>

                  <p className="text-slate-300 text-sm">
                    {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
                  </p>

                  {recordingError && (
                    <p className="text-red-400 text-sm mt-2">{recordingError}</p>
                  )}
                </div>
              </TabsContent>

              {/* Upload Audio Tab */}
              <TabsContent value="upload" className="mt-4">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    isDraggingAudio
                      ? 'border-orange-400 bg-orange-400/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <FileAudio className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-300 mb-4">
                    Drag and drop your audio file here, or
                  </p>
                  <label>
                    <input
                      type="file"
                      accept="audio/*,.m4a,.mp3,.wav,.ogg,.webm"
                      multiple
                      className="hidden"
                      onChange={(e) => addFilesToQueue(e.target.files, 'audio')}
                    />
                    <Button
                      variant="secondary"
                      className="cursor-pointer bg-orange-600 hover:bg-orange-700"
                      asChild
                    >
                      <span>Choose Audio Files</span>
                    </Button>
                  </label>
                </div>
              </TabsContent>

              {/* Photos - email instead */}
              <div className="mt-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-orange-400 shrink-0" />
                  <p className="text-slate-300 text-sm">
                    Got photos of Kevin? Email them to{' '}
                    <a href="mailto:jeff.sutton@officemax.co.nz?subject=Kevin%20Tribute%20-%20Photos" className="text-orange-400 hover:underline font-medium">
                      jeff.sutton@officemax.co.nz
                    </a>
                  </p>
                </div>
              </div>
            </Tabs>

            {/* Queued Files List */}
            {queuedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-white font-medium">
                  Files ({completedCount} complete)
                </h3>

                {audioFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                      <FileAudio className="w-4 h-4" /> Audio ({audioFiles.length})
                    </p>
                    {audioFiles.map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        formatFileSize={formatFileSize}
                        onRemove={file.status === 'pending' ? () => removeFromQueue(file.id) : undefined}
                      />
                    ))}
                  </div>
                )}

              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Details & Submit */}
        <Card className="mb-6 bg-slate-800/50 border-orange-900/50">
          <CardHeader>
            <CardTitle className="text-white">Your Details & Submit</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your name to submit your contribution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-200">Your Name *</Label>
              <Input
                ref={nameInputRef}
                id="name"
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                placeholder="e.g. Sarah Jones"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <div>
              <Label htmlFor="department" className="text-slate-200">Department / Team</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Marketing, Finance, Warehouse"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <div>
              <Label htmlFor="message" className="text-slate-200">Written Message (optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a short written message to accompany your upload..."
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 min-h-[80px]"
              />
            </div>

            {!hasSubmitted && (
              <Button
                onClick={handleSend}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-lg"
                disabled={!yourName.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send My Contribution
                  </>
                )}
              </Button>
            )}

            {hasSubmitted && (
              <div className="flex items-center gap-3 p-4 bg-green-900/30 rounded-lg border border-green-700">
                <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                <p className="text-green-300 font-medium">Sent! Thank you{yourName ? `, ${yourName}` : ''}.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Message */}
        {hasSubmitted && (
          <Card className="mb-6 bg-green-900/30 border-green-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-green-300 font-medium">Thank you{yourName ? `, ${yourName}` : ''}!</p>
                  <p className="text-green-400/80 text-sm">
                    Your contribution has been received and will be included in Kevin's retirement book.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alternative Contact */}
        <Card className="bg-slate-800/30 border-orange-900/50">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-center text-sm">
              Having trouble? Email your recordings or photos to{' '}
              <a href="mailto:jeff.sutton@officemax.co.nz?subject=Kevin%20Tribute" className="text-orange-400 hover:underline">
                jeff.sutton@officemax.co.nz
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Footer - Powered by Plex */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-slate-500 text-sm">For Kevin - Celebrating Your OfficeMax Journey</p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span>Powered by Plex</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// File item component
function FileItem({
  file,
  formatFileSize,
  onRemove
}: {
  file: QueuedFile;
  formatFileSize: (bytes: number) => string;
  onRemove?: () => void;
}) {
  const isProcessing = file.status === 'uploading' || file.status === 'compressing';

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
      {file.status === 'complete' ? (
        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
      ) : file.status === 'error' ? (
        <div className="w-5 h-5 rounded-full bg-red-400 shrink-0" />
      ) : isProcessing ? (
        <div className="w-5 h-5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin shrink-0" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-slate-400 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white truncate">{file.name}</p>
        <p className="text-slate-400 text-sm">
          {file.statusMessage || formatFileSize(file.size)}
        </p>
      </div>
      {isProcessing && (
        <div className="w-20">
          <Progress value={file.progress} className="h-2" />
        </div>
      )}
      {file.status === 'complete' && (
        <span className="text-green-400 text-sm">Done!</span>
      )}
      {file.status === 'error' && (
        <span className="text-red-400 text-sm">Failed</span>
      )}
      {file.status === 'pending' && onRemove && (
        <button
          onClick={onRemove}
          className="text-slate-400 hover:text-red-400 text-sm"
        >
          Remove
        </button>
      )}
    </div>
  );
}
