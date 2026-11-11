import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const toneOptions = [
  { value: 'iep_progress', label: 'IEP Progress Report', description: 'Formal, objective, data-driven' },
  { value: 'parent_positive', label: 'Parent Communication (Positive)', description: 'Warm, encouraging, celebratory' },
  { value: 'parent_concern', label: 'Parent Communication (Concern)', description: 'Professional, supportive, solution-focused' },
  { value: 'incident_report', label: 'Incident Report', description: 'Objective, detailed, factual' },
];

export default function NarrativeGenerator({ 
  buttonText = 'Generate Professional Note',
  buttonVariant = 'outline',
  buttonSize = 'sm',
  onGenerated,
  initialText = '',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [tone, setTone] = useState('parent_positive');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOpen = () => {
    setInputText(initialText);
    setGeneratedText('');
    setCopied(false);
    setIsOpen(true);
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter an observation');
      return;
    }

    setIsGenerating(true);
    setGeneratedText('');

    try {
      const toneInfo = toneOptions.find(t => t.value === tone);
      
      const prompt = `You are an expert special education teacher writing professional documentation. 

Rewrite the following brief observation into a formal, professional paragraph suitable for ${toneInfo.label.toLowerCase()}.

Brief observation: "${inputText}"

Writing guidelines:
- ${toneInfo.description}
- Use person-first language
- Be specific and factual
- Avoid jargon unless appropriate for the context
- Keep it concise (2-4 sentences)
- Use professional educator terminology
${tone === 'iep_progress' ? '- Include observable behaviors and measurable outcomes where applicable' : ''}
${tone.includes('parent') ? '- Write in a tone appropriate for parent communication' : ''}
${tone === 'incident_report' ? '- Use ABC format: Antecedent, Behavior, Consequence if applicable' : ''}

Professional rewrite:`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
      });

      setGeneratedText(result.trim());
    } catch (error) {
      toast.error('Failed to generate narrative');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUse = () => {
    if (onGenerated) {
      onGenerated(generatedText);
    }
    setIsOpen(false);
    toast.success('Professional note applied');
  };

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleOpen}
        className={className}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        {buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Professional Narrative Generator
            </DialogTitle>
            <DialogDescription>
              Transform brief observations into formal, professional documentation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tone Selection */}
            <div className="space-y-2">
              <Label>Documentation Type</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-slate-500">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Input */}
            <div className="space-y-2">
              <Label>Your Brief Observation</Label>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g., 'refused to work' or 'used AAC for play'"
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-slate-500">
                Enter a short note or observation you want to formalize
              </p>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !inputText.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Professional Narrative
                </>
              )}
            </Button>

            {/* Generated Output */}
            {generatedText && (
              <div className="space-y-2">
                <Label>Professional Narrative</Label>
                <div className="relative">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-800 leading-relaxed">{generatedText}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="absolute top-2 right-2"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {generatedText && (
              <Button onClick={handleUse} className="bg-green-600 hover:bg-green-700">
                Use This Text
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}