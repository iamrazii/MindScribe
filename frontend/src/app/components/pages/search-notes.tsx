import React, { useState } from "react";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Search, FileText, Clock, X, Loader2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { api } from "../../lib/api";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  cluster_id: string;
}

export function SearchNotes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Note[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      // Use the RAG endpoint to get relevant notes, then also fetch full list for title/content matching
      const all: Note[] = await api.notes.list();
      const q = searchQuery.toLowerCase();
      const filtered = all.filter(
        (n) =>
          (n.title ?? "").toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
      );
      setResults(filtered);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setResults([]);
    setHasSearched(false);
  };

  const highlight = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-cyan-500/30 text-cyan-200 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="p-6 lg:p-8 font-sans">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">Search Notes</h1>
        <p className="text-gray-300">Find notes quickly with full-text search</p>
      </div>

      <Card className="mb-6 border-white/10 bg-white/5 backdrop-blur-sm">
        <CardContent className="p-6 relative z-10">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Search by title, content, or keywords..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value.trim()) { setResults([]); setHasSearched(false); }
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="border-white/20 bg-white/5 pl-10 pr-10 text-white placeholder:text-gray-500"
              />
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white"
            >
              {isSearching ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasSearched && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl text-white">
              {results.length > 0
                ? `Found ${results.length} result${results.length !== 1 ? "s" : ""}`
                : "No results found"}
            </h2>
          </div>

          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((note) => (
                <Card key={note.id} className="group border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10">
                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 text-xs">
                            note
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Clock className="size-3" />
                            {formatDate(note.created_at)}
                          </div>
                        </div>
                        <CardTitle className="text-white">
                          {highlight(note.title ?? "Untitled", searchQuery)}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-gray-300 text-sm line-clamp-4">
                      {highlight(note.content, searchQuery)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12 relative z-10">
                <FileText className="mb-4 size-12 text-gray-500" />
                <h3 className="mb-2 text-lg text-white">No results found</h3>
                <p className="text-center text-gray-400">Try different keywords</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!hasSearched && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Search, title: "Quick Search", desc: "Type keywords and press Enter" },
            { icon: FileText, title: "Full Text", desc: "Finds notes by any text within" },
            { icon: Clock, title: "Instant Results", desc: "Sorted by relevance" },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-4 relative z-10">
                <div className="mb-2 flex items-center gap-2 text-cyan-400">
                  <Icon className="size-4" />
                  <span className="font-semibold">{title}</span>
                </div>
                <p className="text-sm text-gray-300">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}