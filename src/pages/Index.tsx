import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Upload, CheckCircle2, Award, Mic, Image, Clock, HelpCircle, FileAudio, ImageIcon, MessageSquare, Lightbulb } from 'lucide-react';
import { sendFileToWebhook, FileCategory } from '@/lib/webhook';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RubberBandBall } from '@/components/RubberBandBall';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  category: FileCategory;
  uploadedAt: Date;
  status: 'uploading' | 'complete' | 'error';
  progress: number;
}

export default function Index() {
  const [yourName, setYourName] = useState('');
  const [department, setDepartment] = useState('');
  const [message, setMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const handleFileUpload = useCallback(async (files: FileList | null, category: FileCategory) => {
    if (!files || files.length === 0) return;

    if (!yourName.trim()) {
      toast.error('Please enter your name first');
      return;
    }

    for (const file of Array.from(files)) {
      const fileId = crypto.randomUUID();
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        category,
        uploadedAt: new Date(),
        status: 'uploading',
        progress: 0,
      };

      setUploadedFiles(prev => [...prev, newFile]);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      try {
        // Send to n8n webhook
        await sendFileToWebhook(file, category, yourName, department, message);

        clearInterval(interval);

        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'complete', progress: 100 }
              : f
          )
        );
        toast.success(`${file.name} uploaded successfully!`);
      } catch (error) {
        clearInterval(interval);
        console.error('Upload error:', error);
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'error', progress: 0 }
              : f
          )
        );
        toast.error(`Failed to upload ${file.name}. Try emailing to jeff@plex.nz instead.`);
      }
    }
  }, [yourName, department, message]);

  const handleDrop = useCallback((e: React.DragEvent, category: FileCategory) => {
    e.preventDefault();
    if (category === 'audio') setIsDraggingAudio(false);
    if (category === 'image') setIsDraggingImage(false);
    handleFileUpload(e.dataTransfer.files, category);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent, category: FileCategory) => {
    e.preventDefault();
    if (category === 'audio') setIsDraggingAudio(true);
    if (category === 'image') setIsDraggingImage(true);
  }, []);

  const handleDragLeave = useCallback((category: FileCategory) => {
    if (category === 'audio') setIsDraggingAudio(false);
    if (category === 'image') setIsDraggingImage(false);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const completedCount = uploadedFiles.filter(f => f.status === 'complete').length;
  const audioFiles = uploadedFiles.filter(f => f.category === 'audio');
  const imageFiles = uploadedFiles.filter(f => f.category === 'image');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-orange-950/20 to-slate-900">
      {/* Rubber Band Ball Animation Area */}
      <div className="relative h-24 w-full overflow-hidden bg-gradient-to-b from-orange-900/30 to-transparent">
        <RubberBandBall size={50} />
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="text-center mb-8">
          <Award className="w-12 h-12 mx-auto mb-4 text-orange-400" />
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
                    <p>iPhone: Voice Memos app (built-in)</p>
                    <p>Android: Recorder or Voice Recorder app</p>
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

        {/* Your Details */}
        <Card className="mb-6 bg-slate-800/50 border-orange-900/50">
          <CardHeader>
            <CardTitle className="text-white">Your Details</CardTitle>
            <CardDescription className="text-slate-400">
              Required so we know who each contribution is from
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-200">Your Name *</Label>
              <Input
                id="name"
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                placeholder="e.g. Sarah Jones"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                required
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
          </CardContent>
        </Card>

        {/* Upload Area with Tabs */}
        <Card className="mb-6 bg-slate-800/50 border-orange-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-400" />
              Upload Your Contribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="audio" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                <TabsTrigger value="audio" className="data-[state=active]:bg-orange-600">
                  <FileAudio className="w-4 h-4 mr-2" />
                  Voice Recording
                </TabsTrigger>
                <TabsTrigger value="image" className="data-[state=active]:bg-orange-600">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Photos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="audio" className="mt-4">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    isDraggingAudio
                      ? 'border-orange-400 bg-orange-400/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  onDrop={(e) => handleDrop(e, 'audio')}
                  onDragOver={(e) => handleDragOver(e, 'audio')}
                  onDragLeave={() => handleDragLeave('audio')}
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
                      onChange={(e) => handleFileUpload(e.target.files, 'audio')}
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

              <TabsContent value="image" className="mt-4">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    isDraggingImage
                      ? 'border-orange-400 bg-orange-400/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  onDrop={(e) => handleDrop(e, 'image')}
                  onDragOver={(e) => handleDragOver(e, 'image')}
                  onDragLeave={() => handleDragLeave('image')}
                >
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-300 mb-4">
                    Drag and drop your photos here, or
                  </p>
                  <label>
                    <input
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.gif,.heic,.webp"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files, 'image')}
                    />
                    <Button
                      variant="secondary"
                      className="cursor-pointer bg-orange-600 hover:bg-orange-700"
                      asChild
                    >
                      <span>Choose Photos</span>
                    </Button>
                  </label>
                </div>
              </TabsContent>
            </Tabs>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-white font-medium">
                  Uploaded Files ({completedCount} complete)
                </h3>

                {audioFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                      <FileAudio className="w-4 h-4" /> Audio ({audioFiles.length})
                    </p>
                    {audioFiles.map((file) => (
                      <FileItem key={file.id} file={file} formatFileSize={formatFileSize} />
                    ))}
                  </div>
                )}

                {imageFiles.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Photos ({imageFiles.length})
                    </p>
                    {imageFiles.map((file) => (
                      <FileItem key={file.id} file={file} formatFileSize={formatFileSize} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Message */}
        {completedCount > 0 && (
          <Card className="mb-6 bg-green-900/30 border-green-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-green-300 font-medium">Thank you, {yourName}!</p>
                  <p className="text-green-400/80 text-sm">
                    Your {completedCount === 1 ? 'contribution has' : 'contributions have'} been received.
                    They'll be included in Kevin's retirement book.
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
              Having trouble uploading? Email your files to{' '}
              <a href="mailto:jeff@plex.nz" className="text-orange-400 hover:underline">
                jeff@plex.nz
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
function FileItem({ file, formatFileSize }: { file: UploadedFile; formatFileSize: (bytes: number) => string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
      {file.status === 'complete' ? (
        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
      ) : file.status === 'error' ? (
        <div className="w-5 h-5 rounded-full bg-red-400 shrink-0" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white truncate">{file.name}</p>
        <p className="text-slate-400 text-sm">{formatFileSize(file.size)}</p>
      </div>
      {file.status === 'uploading' && (
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
    </div>
  );
}
