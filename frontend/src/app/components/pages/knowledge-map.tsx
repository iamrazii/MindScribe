import React, { useState } from 'react'; 
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ZoomIn, ZoomOut, Maximize2, Plus } from 'lucide-react';

export function KnowledgeMap() {
  const [zoom, setZoom] = useState(100);

  const nodes = [
    { id: 1, title: 'Machine Learning', x: 300, y: 200, category: 'tech' },
    { id: 2, title: 'Neural Networks', x: 500, y: 150, category: 'tech' },
    { id: 3, title: 'Data Science', x: 450, y: 300, category: 'tech' },
    { id: 4, title: 'Python', x: 600, y: 250, category: 'programming' },
    { id: 5, title: 'Project Ideas', x: 200, y: 350, category: 'ideas' },
    { id: 6, title: 'Research Notes', x: 350, y: 450, category: 'research' },
  ];

  const connections = [
    { from: 1, to: 2 },
    { from: 1, to: 3 },
    { from: 2, to: 4 },
    { from: 3, to: 4 },
    { from: 1, to: 5 },
    { from: 3, to: 6 },
  ];

  const categoryColors: Record<string, string> = {
    tech: 'bg-cyan-500',
    programming: 'bg-yellow-500',
    ideas: 'bg-emerald-500',
    research: 'bg-teal-500',
  };

  return (
    <div className="flex h-full flex-col p-6 lg:p-8 font-sans">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">Knowledge Map</h1>
        <p className="text-gray-300">
          Visualize how your notes and ideas are connected
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="flex items-center gap-2 p-3 relative z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="min-w-[60px] text-center text-sm text-white font-medium">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              <ZoomIn className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(100)}
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              <Maximize2 className="size-4" />
            </Button>
          </CardContent>
        </Card>

        <Button 
          variant="default" 
          size="default" 
          className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700"
        >
          <Plus className="mr-2 size-4" />
          Add Connection
        </Button>
      </div>

      <Card className="flex-1 border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <CardContent className="relative h-full p-0 relative z-10">
          <div className="absolute inset-0 overflow-auto">
            <svg
              className="h-full w-full"
              style={{
                minHeight: '600px',
                minWidth: '800px',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left',
              }}
            >
              {connections.map((conn, idx) => {
                const fromNode = nodes.find((n) => n.id === conn.from);
                const toNode = nodes.find((n) => n.id === conn.to);
                if (!fromNode || !toNode) return null;

                return (
                  <line
                    key={idx}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="rgba(20, 184, 166, 0.3)"
                    strokeWidth="2"
                    className="transition-all hover:stroke-cyan-400"
                  />
                );
              })}

              {nodes.map((node) => (
                <g key={node.id} className="cursor-pointer">
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="50"
                    className={`${categoryColors[node.category]} opacity-20 transition-all hover:opacity-40`}
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="40"
                    className={`${categoryColors[node.category]} transition-all hover:scale-110`}
                  />
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white text-[10px] font-bold pointer-events-none select-none"
                  >
                    {node.title}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4">
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-white">Categories</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="size-4 rounded-full bg-cyan-500" />
                <span className="text-sm text-gray-300">Technology</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-4 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-300">Programming</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-4 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-300">Ideas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-4 rounded-full bg-teal-500" />
                <span className="text-sm text-gray-300">Research</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}