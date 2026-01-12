export type VoiceType = 
  | 'crazy_idea' 
  | 'coaching' 
  | 'meeting' 
  | 'presentation' 
  | 'skill_update' 
  | 'project_research';

export type RecordingStatus = 'pending' | 'processing' | 'complete' | 'error';

export type SkillTarget = 'pm' | 'homelab';
export type ProjectType = 'new_project' | 'research';

export interface Recording {
  id: string;
  type: VoiceType;
  timestamp: string;
  duration: number;
  status: RecordingStatus;
  agenda?: string;
  skillTarget?: SkillTarget;
  projectType?: ProjectType;
  projectName?: string;
  audioBlob?: Blob;
  attachedFile?: File;
  errorMessage?: string;
}

export interface TypeConfig {
  id: VoiceType;
  label: string;
  icon: string;
  colorClass: string;
  glowClass: string;
  hex: string;
}

export const VOICE_TYPES: TypeConfig[] = [
  { id: 'crazy_idea', label: 'Crazy Idea', icon: 'Lightbulb', colorClass: 'text-type-crazy-idea', glowClass: 'type-glow-crazy-idea', hex: '#f59e0b' },
  { id: 'coaching', label: 'Coaching', icon: 'BookOpen', colorClass: 'text-type-coaching', glowClass: 'type-glow-coaching', hex: '#10b981' },
  { id: 'meeting', label: 'Meeting Notes', icon: 'Users', colorClass: 'text-type-meeting', glowClass: 'type-glow-meeting', hex: '#3b82f6' },
  { id: 'presentation', label: 'Presentation', icon: 'Presentation', colorClass: 'text-type-presentation', glowClass: 'type-glow-presentation', hex: '#8b5cf6' },
  { id: 'skill_update', label: 'Skill Update', icon: 'Settings', colorClass: 'text-type-skill', glowClass: 'type-glow-skill', hex: '#ec4899' },
  { id: 'project_research', label: 'Project/Research', icon: 'Folder', colorClass: 'text-type-project', glowClass: 'type-glow-project', hex: '#06b6d4' },
];
