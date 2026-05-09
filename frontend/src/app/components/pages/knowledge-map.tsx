import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { ZoomIn, ZoomOut, Maximize2, Loader2, Network } from "lucide-react";
import { api } from "../../lib/api";
import { toast } from "sonner";

interface Cluster {
  id: string;
  name: string;
  description: string;
  note_count: number;
}

const COLORS = [
  "bg-cyan-500", "bg-teal-500", "bg-emerald-500",
  "bg-yellow-500", "bg-purple-500", "bg-pink-500",
  "bg-blue-500", "bg-orange-500",
];

export function KnowledgeMap() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [selected, setSelected] = useState<Cluster | null>(null);

  useEffect(() => {
    api.clusters
      .list()
      .then((data) => setClusters(data ?? []))
      .catch(() => toast.error("Failed to load knowledge map"))
      .finally(() => setIsLoading(false));
  }, []);

  // Position clusters in a rough circular layout
  const positioned = clusters.map((c, i) => {
    const angle = (i / Math.max(clusters.length, 1)) * 2 * Math.PI;
    const radius = Math.min(220, 80 + clusters.length * 20);
    return {
      ...c,
      x: 350 + radius * Math.cos(angle),
      y: 250 + radius * Math.sin(angle),
      color: COLORS[i % COLORS.length],
    };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="size-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 font-sans">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Knowledge Map</h1>
          <p className="text-gray-300">Visual overview of your AI-generated note clusters</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.min(z + 10, 150))}
            className="border-white/20 bg-white/5 text-gray-300">
            <ZoomIn className="size-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.max(z - 10, 50))}
            className="border-white/20 bg-white/5 text-gray-300">
            <ZoomOut className="size-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setZoom(100)}
            className="border-white/20 bg-white/5 text-gray-300">
            <Maximize2 className="size-4" />
          </Button>
        </div>
      </div>

      {clusters.length === 0 ? (
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 relative z-10">
            <Network className="mb-4 size-12 text-gray-500" />
            <h3 className="mb-2 text-lg text-white font-semibold">No clusters yet</h3>
            <p className="text-gray-400">Create some notes and AI will automatically cluster them here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* SVG Map */}
          <div className="lg:col-span-2">
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0 relative z-10">
                <div
                  className="relative overflow-auto"
                  style={{ height: "500px" }}
                >
                  <svg
                    width="700"
                    height="500"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
                  >
                    {/* Connections between adjacent clusters */}
                    {positioned.map((c, i) =>
                      positioned.slice(i + 1).map((d, j) => (
                        <line
                          key={`${i}-${j}`}
                          x1={c.x} y1={c.y} x2={d.x} y2={d.y}
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="1"
                        />
                      ))
                    )}

                    {/* Cluster nodes */}
                    {positioned.map((c) => (
                      <g
                        key={c.id}
                        transform={`translate(${c.x},${c.y})`}
                        onClick={() => setSelected(c)}
                        style={{ cursor: "pointer" }}
                      >
                        <circle
                          r={Math.min(20 + c.note_count * 6, 48)}
                          className={selected?.id === c.id ? "fill-cyan-400" : "fill-white/20"}
                          stroke={selected?.id === c.id ? "rgb(6 182 212)" : "rgba(255,255,255,0.3)"}
                          strokeWidth="2"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-white text-xs"
                          fontSize="11"
                          fontWeight="500"
                        >
                          {c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name}
                        </text>
                        <text
                          y={Math.min(20 + c.note_count * 6, 48) + 14}
                          textAnchor="middle"
                          className="fill-gray-400"
                          fontSize="10"
                        >
                          {c.note_count} note{c.note_count !== 1 ? "s" : ""}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details panel */}
          <div className="space-y-4">
            {selected ? (
              <Card className="border-cyan-500/30 bg-cyan-500/10 backdrop-blur-sm">
                <CardHeader className="relative z-10">
                  <CardTitle className="text-cyan-300">{selected.name}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 space-y-3 text-sm">
                  <p className="text-gray-300">{selected.description}</p>
                  <div className="rounded-lg bg-white/5 px-3 py-2 text-cyan-400 font-mono">
                    {selected.note_count} note{selected.note_count !== 1 ? "s" : ""}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-10 relative z-10 text-gray-500">
                  <Network className="mb-3 size-8 opacity-40" />
                  <p className="text-sm">Click a cluster to see details</p>
                </CardContent>
              </Card>
            )}

            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardHeader className="relative z-10">
                <CardTitle className="text-white text-sm">All Clusters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 relative z-10">
                {positioned.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`w-full flex items-center gap-3 rounded-lg p-2 text-left transition-all ${
                      selected?.id === c.id ? "bg-cyan-500/20" : "hover:bg-white/5"
                    }`}
                  >
                    <div className={`size-3 rounded-full ${c.color} shrink-0`} />
                    <span className="text-sm text-gray-200 truncate flex-1">{c.name}</span>
                    <span className="text-xs text-gray-500 shrink-0">{c.note_count}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}