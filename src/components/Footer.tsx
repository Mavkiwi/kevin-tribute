import { Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

export function Footer() {
  const [testing, setTesting] = useState(false);

  const testWebhook = async () => {
    setTesting(true);
    const webhookUrl = 'https://plex.app.n8n.cloud/webhook/voice-idea';
    
    console.log('[Webhook Test] Starting test to:', webhookUrl);
    
    try {
      const testData = new FormData();
      testData.append('metadata', JSON.stringify({
        type: 'test',
        timestamp: new Date().toISOString(),
        message: 'Test from Plex Voice Capture'
      }));

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: testData,
      });

      console.log('[Webhook Test] Response:', response.status, response.statusText);

      if (response.ok) {
        toast.success('Webhook test successful!');
      } else {
        toast.error(`Webhook test failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[Webhook Test] Error:', error);
      toast.error(`Webhook test error: ${error instanceof Error ? error.message : 'Unknown'}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <footer className="text-center py-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <div className="flex flex-col items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={testWebhook}
          disabled={testing}
          className="text-xs"
        >
          <Webhook className="w-3 h-3 mr-2" />
          {testing ? 'Testing...' : 'Test Webhook'}
        </Button>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
          <Webhook className="w-3 h-3" />
          <span>Connected to plex.app.n8n.cloud</span>
        </div>
      </div>
    </footer>
  );
}
