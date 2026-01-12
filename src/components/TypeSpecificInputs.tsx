import { VoiceType, SkillTarget, ProjectType } from '@/types/voice-capture';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface TypeSpecificInputsProps {
  type: VoiceType;
  agenda: string;
  setAgenda: (value: string) => void;
  skillTarget: SkillTarget;
  setSkillTarget: (value: SkillTarget) => void;
  projectType: ProjectType;
  setProjectType: (value: ProjectType) => void;
  projectName: string;
  setProjectName: (value: string) => void;
}

export function TypeSpecificInputs({
  type,
  agenda,
  setAgenda,
  skillTarget,
  setSkillTarget,
  projectType,
  setProjectType,
  projectName,
  setProjectName,
}: TypeSpecificInputsProps) {
  if (type === 'meeting') {
    return (
      <div className="w-full max-w-sm mx-auto space-y-2 animate-scale-in">
        <Label htmlFor="agenda" className="text-sm text-muted-foreground">
          Meeting Agenda <span className="text-type-recording">*</span>
        </Label>
        <Textarea
          id="agenda"
          placeholder="What's this meeting about?"
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          className="glass-card border-border/30 min-h-[80px] resize-none focus:ring-2 focus:ring-type-meeting/50"
        />
      </div>
    );
  }

  if (type === 'skill_update') {
    return (
      <div className="w-full max-w-sm mx-auto animate-scale-in">
        <div className="glass-card p-4 rounded-xl">
          <Label className="text-sm text-muted-foreground mb-3 block">Skill Category</Label>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium transition-colors ${skillTarget === 'pm' ? 'text-type-skill' : 'text-muted-foreground'}`}>
              PM Skill
            </span>
            <Switch
              checked={skillTarget === 'homelab'}
              onCheckedChange={(checked) => setSkillTarget(checked ? 'homelab' : 'pm')}
              className="data-[state=checked]:bg-type-skill"
            />
            <span className={`text-sm font-medium transition-colors ${skillTarget === 'homelab' ? 'text-type-skill' : 'text-muted-foreground'}`}>
              Home Lab Skill
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'project_research') {
    return (
      <div className="w-full max-w-sm mx-auto space-y-4 animate-scale-in">
        <div className="glass-card p-4 rounded-xl">
          <Label className="text-sm text-muted-foreground mb-3 block">Project Type</Label>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium transition-colors ${projectType === 'new_project' ? 'text-type-project' : 'text-muted-foreground'}`}>
              New Project
            </span>
            <Switch
              checked={projectType === 'research'}
              onCheckedChange={(checked) => setProjectType(checked ? 'research' : 'new_project')}
              className="data-[state=checked]:bg-type-project"
            />
            <span className={`text-sm font-medium transition-colors ${projectType === 'research' ? 'text-type-project' : 'text-muted-foreground'}`}>
              Research
            </span>
          </div>
        </div>
        {projectType === 'new_project' && (
          <div className="space-y-2">
            <Label htmlFor="projectName" className="text-sm text-muted-foreground">
              Project Name
            </Label>
            <Input
              id="projectName"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="glass-card border-border/30 focus:ring-2 focus:ring-type-project/50"
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}
