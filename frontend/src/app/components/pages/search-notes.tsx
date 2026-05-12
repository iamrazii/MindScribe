import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Search, FileText, Clock, Filter, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { api } from "../../lib/api";
import { toast } from "sonner";

export function SearchNotes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [allNotes, setAllNotes] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await api.notes.list();
        setAllNotes(data || []);
      } catch (error) {
        toast.error("Failed to load notes");
      }
    };
    fetchNotes();
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const filtered = allNotes.filter(
      (note) =>
        (note.title && note.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setResults(filtered);
    setIsSearching(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setResults([]);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-cyan-500/30 text-cyan-200">{part}</mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">Search Notes</h1>
        <p className="text-gray-300">Find notes quickly with powerful search</p>
      </div>

      <Card className="mb-6 border-white/10 bg-white/5 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Search by title, content, or keywords..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value.trim()) {
                    setResults([]);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                className="border-white/20 bg-white/5 pl-10 pr-10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
              />
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              {searchQuery && (
                <button onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Button
              variant="default"
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700 shadow-lg shadow-cyan-900/20"
            >
              <Search className="mr-2 size-4" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchQuery && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl text-white">
              {results.length > 0 ? `Found ${results.length} result${results.length !== 1 ? "s" : ""}` : "No results found"}
            </h2>
          </div>

          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result) => (
                <Card key={result.id} className="group border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10 hover:shadow-lg hover:shadow-cyan-500/10">
                  <CardHeader className="">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="outline" className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">Note</Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Clock className="size-3" />
                            {new Date(result.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <CardTitle className="text-white">
                          {highlightText(result.title || "Untitled", searchQuery)}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="">
                    <p className="mb-3 text-gray-300">
                      {highlightText(result.content.substring(0, 300) + '...', searchQuery)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 size-12 text-gray-500" />
                <h3 className="mb-2 text-lg text-white">No results found</h3>
                <p className="text-center text-gray-400">Try different keywords or check your spelling</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}