import { ChevronDown, Lightbulb, BookOpen, Users, Presentation, Settings, Folder } from 'lucide-react';
import { VoiceType, VOICE_TYPES, TypeConfig } from '@/types/voice-capture';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const iconMap = {
  Lightbulb,
  BookOpen,
  Users,
  Presentation,
  Settings,
  Folder,
};

interface TypeSelectorProps {
  value: VoiceType;
  onChange: (type: VoiceType) => void;
}

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  const selectedType = VOICE_TYPES.find(t => t.id === value)!;
  const Icon = iconMap[selectedType.icon as keyof typeof iconMap];

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <Select value={value} onValueChange={(v) => onChange(v as VoiceType)}>
        <SelectTrigger className="glass-card h-14 px-4 border-border/30 focus:ring-2 focus:ring-primary/50 transition-all">
          <SelectValue>
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${selectedType.hex}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: selectedType.hex }} />
              </div>
              <span className="font-medium">{selectedType.label}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="glass-card border-border/30">
          {VOICE_TYPES.map((type) => {
            const TypeIcon = iconMap[type.icon as keyof typeof iconMap];
            return (
              <SelectItem 
                key={type.id} 
                value={type.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${type.hex}20` }}
                  >
                    <TypeIcon className="w-4 h-4" style={{ color: type.hex }} />
                  </div>
                  <span className="font-medium">{type.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
