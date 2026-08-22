import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, ArrowLeft, Eye } from 'lucide-react';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { api } from '../../lib/api';

export function KnowledgeMap() {
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(100);
  const [selected, setSelected] = useState<any>(null);
  const [clusters, setClusters] = useState<any[]>([]);
  const [allNotes, setAllNotes] = useState<any[]>([]);

  const loadMapData = async () => {
    try {
      const fetchedClusters = await api.clusters.list();
      const fetchedNotes = await api.notes.list();

      setAllNotes(fetchedNotes || []);

      const mappedClusters = (fetchedClusters || []).map((cluster: any, index: number) => {
        const clusterNotes = (fetchedNotes || []).filter((n: any) => n.cluster_id === cluster.id);
        const radius = 200;
        const angle = (index / (fetchedClusters.length || 1)) * 2 * Math.PI;
        
        return {
          ...cluster,
          notes: clusterNotes,
          x: 400 + radius * Math.cos(angle),
          y: 400 + radius * Math.sin(angle),
          color: 'from-cyan-500 to-blue-500',
          bgColor: 'bg-cyan-500',
          size: clusterNotes.length || 1
        };
      });

      setClusters(mappedClusters);
    } catch (error) {
      toast.error('Failed to load knowledge map data');
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  const handleRefresh = () => {
    loadMapData();
    toast.success('Map refreshed!');
  };

  const handleClusterClick = (cluster: any) => {
    setSelected(cluster);
  };

  const handleBackToMap = () => {
    setSelected(null);
  };

  const handleNoteClick = (note: any) => {
    navigate('/view-note', { state: { note } });
  };

  const getTotalNotes = () => allNotes.length;

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl text-white">Knowledge Map</h1>
        <p className="text-gray-300">Explore your notes organized by dynamically generated topics</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3">
          {selected ? (
            <Button variant="outline" onClick={handleBackToMap} className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 size-4" />
              Back to Map
            </Button>
          ) : (
            <>
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardContent className="flex items-center gap-2 p-3">
                  <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(50, zoom - 10))} className="border-white/20 bg-transparent text-white hover:bg-white/10">
                    <ZoomOut className="size-4" />
                  </Button>
                  <span className="min-w-[60px] text-center text-sm text-white">{zoom}%</span>
                  <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(200, zoom + 10))} className="border-white/20 bg-transparent text-white hover:bg-white/10">
                    <ZoomIn className="size-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setZoom(100)} className="border-white/20 bg-transparent text-white hover:bg-white/10">
                    <Maximize2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>

              <Button variant="default" onClick={handleRefresh} className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700">
                <RefreshCw className="mr-2 size-4" />
                Refresh Map
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span>Total Notes: {getTotalNotes()}</span>
          <span className="text-gray-500">•</span>
          <span>Clusters: {clusters.length}</span>
        </div>
      </div>

      {selected ? (
        <div className="flex-1 space-y-4 min-h-[700px]">
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className={`size-4 rounded-full ${selected.bgColor}`} />
                    {selected.name}
                  </CardTitle>
                  <CardDescription className="text-gray-400 mt-1">
                    {selected.notes.length} notes in this cluster
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selected.notes.map((note: any) => (
              <Card
                key={note.id}
                onClick={() => handleNoteClick(note)}
                className="group border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:scale-[1.02] hover:bg-white/10 hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer"
              >
                <CardHeader className="">
                  <div className="mb-2 flex items-start justify-between">
                    <Badge variant="outline" className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">Note</Badge>
                    <Button size="sm" variant="ghost" className="size-8 p-0 text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400" onClick={(e) => { e.stopPropagation(); handleNoteClick(note); }}>
                      <Eye className="size-4" />
                    </Button>
                  </div>
                  <CardTitle className="line-clamp-2 text-white text-base">{note.title || "Untitled"}</CardTitle>
                </CardHeader>
                <CardContent className="">
                  <p className="mb-4 line-clamp-3 text-sm text-gray-300">{note.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                    <span>{note.content?.split(/\s+/).length || 0} words</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="flex-1 border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden min-h-[800px]">
          <CardContent className="relative h-full p-0 min-h-[800px]">
            <div className="absolute inset-0 overflow-auto">
              <svg className="h-full w-full" style={{ minHeight: '800px', minWidth: '800px', transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
                {clusters.map((cluster) => {
                  const radius = 40 + (cluster.notes.length * 5);
                  return (
                    <g key={cluster.id} onClick={() => handleClusterClick(cluster)} className="cursor-pointer">
                      <circle
                        cx={cluster.x}
                        cy={cluster.y}
                        r={radius}
                        fill="rgba(255, 255, 255, 0.05)"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="2"
                      />
                      <text x={cluster.x} y={cluster.y - 5} textAnchor="middle" dominantBaseline="middle" className="fill-white text-sm font-semibold pointer-events-none select-none">
                        {cluster.name}
                      </text>
                      <text x={cluster.x} y={cluster.y + 12} textAnchor="middle" className="fill-white/80 text-xs pointer-events-none select-none">
                        {cluster.notes.length} notes
                      </text>
                      <text x={cluster.x} y={cluster.y + 28} textAnchor="middle" className="fill-cyan-300 text-[10px] pointer-events-none select-none opacity-70">
                        Click to explore →
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}