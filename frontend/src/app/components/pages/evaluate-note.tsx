import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  FileCheck,
  Loader2,
  TrendingUp,
  CheckCircle2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "../ui/progress";

interface Evaluation {
  overallScore: number;
  clarity: number;
  structure: number;
  completeness: number;
  strengths: string[];
  improvements: string[];
  readability: string;
}

export function EvaluateNote() {
  const [noteContent, setNoteContent] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleEvaluate = () => {
    if (!noteContent.trim()) {
      toast.error("Please enter note content to evaluate");
      return;
    }

    setIsEvaluating(true);
    setTimeout(() => {
      const mockEvaluation: Evaluation = {
        overallScore: 82,
        clarity: 85,
        structure: 78,
        completeness: 84,
        strengths: [
          "Clear and concise writing style",
          "Well-organized main points",
          "Good use of examples",
          "Proper grammar and punctuation",
        ],
        improvements: [
          "Add more supporting details in section 2",
          "Consider including a summary at the end",
          "Break down longer paragraphs for better readability",
          "Add transitions between major sections",
        ],
        readability: "College Level",
      };

      setEvaluation(mockEvaluation);
      setIsEvaluating(false);
      toast.success("Evaluation complete!");
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className="p-6 lg:p-8 font-sans">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">Evaluate Note</h1>
        <p className="text-gray-300">Get AI-powered analysis and improvement suggestions</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="relative z-10">
              <CardTitle className="text-white">Note Content</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <Textarea
                placeholder="Paste or type your note content here for evaluation..."
                value={noteContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNoteContent(e.target.value)}
                className="min-h-[500px] border-white/20 bg-white/5 text-white placeholder:text-gray-500"
              />
              <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                <span>{noteContent.length} characters</span>
                <span>{noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0} words</span>
              </div>
              <Button
                variant="default"
                size="lg"
                onClick={handleEvaluate}
                disabled={isEvaluating || !noteContent.trim()}
                className="mt-4 w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <FileCheck className="mr-2 size-4" />
                    Evaluate Note
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {evaluation ? (
            <React.Fragment>
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader className="relative z-10">
                  <CardTitle className="text-white">Overall Score</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`text-6xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                      {evaluation.overallScore}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 text-sm text-gray-400">Out of 100</div>
                      <Progress value={evaluation.overallScore} className="h-3 bg-white/10" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader className="relative z-10">
                  <CardTitle className="text-white">Detailed Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  {(["clarity", "structure", "completeness"] as const).map((key) => (
                    <div key={key}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-gray-300 capitalize">{key}</span>
                        <span className={getScoreColor(evaluation[key])}>{evaluation[key]}%</span>
                      </div>
                      <Progress value={evaluation[key]} className="h-2 bg-white/10" />
                    </div>
                  ))}
                  <div className="flex items-center justify-between rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                    <span className="text-sm text-gray-300 font-medium">Readability Level</span>
                    <span className="text-sm font-bold text-cyan-400">{evaluation.readability}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <CheckCircle2 className="size-5 text-emerald-400" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ul className="space-y-2">
                    {evaluation.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="mt-0.5 text-emerald-400">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="size-5 text-amber-400" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ul className="space-y-2">
                    {evaluation.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="mt-0.5 text-amber-400">→</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </React.Fragment>
          ) : (
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardContent className="flex min-h-[500px] items-center justify-center relative z-10">
                <div className="text-center">
                  <FileCheck className="mx-auto mb-4 size-16 text-gray-600" />
                  <h3 className="mb-2 text-lg text-white">No Evaluation Yet</h3>
                  <p className="text-gray-400">Enter your note content and click evaluate</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Card className="border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm">
          <CardContent className="flex items-start gap-3 p-4 relative z-10">
            <Info className="size-5 flex-shrink-0 text-cyan-400" />
            <div className="text-sm text-gray-300">
              <strong className="text-cyan-400">How it works:</strong> Our AI analyzes your note for clarity, structure,
              and completeness.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}