import React, { useState } from "react";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Search,
  FileText,
  Clock,
  Filter,
  X,
} from "lucide-react";
import { Badge } from "../ui/badge";

interface SearchResult {
  id: number;
  title: string;
  content: string;
  date: string;
  category: string;
  matchedText: string;
}

export function SearchNotes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const allNotes: SearchResult[] = [
    {
      id: 1,
      title: "Meeting Notes - Q1 Planning",
      content:
        "Discussed project roadmap and key milestones for the upcoming quarter. Focus on product development and market expansion strategies.",
      date: "2 hours ago",
      category: "Work",
      matchedText: "project roadmap and key milestones",
    },
    {
      id: 2,
      title: "Project Ideas",
      content:
        "Brainstorming session for new features and improvements to the platform. Consider user feedback and market trends.",
      date: "1 day ago",
      category: "Ideas",
      matchedText: "new features and improvements",
    },
    {
      id: 3,
      title: "Research Notes - AI Technology",
      content:
        "Comprehensive notes on the latest advancements in artificial intelligence and machine learning applications.",
      date: "2 days ago",
      category: "Research",
      matchedText:
        "artificial intelligence and machine learning",
    },
    {
      id: 4,
      title: "Team Retrospective",
      content:
        "Reflecting on the past sprint and identifying areas for improvement in our development process and team collaboration.",
      date: "1 week ago",
      category: "Work",
      matchedText: "development process and team collaboration",
    },
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setTimeout(() => {
      const filtered = allNotes.filter(
        (note) =>
          note.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          note.content
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
      setResults(filtered);
      setIsSearching(false);
    }, 500);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setResults([]);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={index}
          className="bg-cyan-500/30 text-cyan-200"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div className="p-6 lg:p-8 font-sans">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">
          Search Notes
        </h1>
        <p className="text-gray-300">
          Find notes quickly with powerful search
        </p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6 border-white/10 bg-white/5 backdrop-blur-sm">
        <CardContent className="p-6 relative z-10">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                id="main-search"
                placeholder="Search by title, content, or keywords..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value.trim()) {
                    setResults([]);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="border-white/20 bg-white/5 pl-10 pr-10 text-white placeholder:text-gray-500"
              />
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Button
              variant="default"
              size="default"
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white"
            >
              <Search className="mr-2 size-4" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchQuery && (
        <React.Fragment>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl text-white">
              {results.length > 0
                ? `Found ${results.length} result${results.length !== 1 ? "s" : ""}`
                : "No results found"}
            </h2>
            {results.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Filter className="size-4" />
                Showing all results
              </div>
            )}
          </div>

          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result) => (
                <Card
                  key={result.id}
                  className="group border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
                            {result.category}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Clock className="size-3" />
                            {result.date}
                          </div>
                        </div>
                        <CardTitle className="text-white">
                          {highlightText(result.title, searchQuery)}
                        </CardTitle>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-gray-300 hover:text-cyan-400"
                      >
                        Open
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="mb-3 text-gray-300">
                      {highlightText(result.content, searchQuery)}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">Matched:</span>
                      <span className="rounded bg-cyan-600/20 px-2 py-1 text-cyan-300 border border-cyan-500/20">
                        "{result.matchedText}"
                      </span>
                    </div>
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
        </React.Fragment>
      )}

      {/* Search Tips */}
      {!searchQuery && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-4 relative z-10">
              <div className="mb-2 flex items-center gap-2 text-cyan-400">
                <Search className="size-4" />
                <span className="font-semibold">Quick Search</span>
              </div>
              <p className="text-sm text-gray-300">Type keywords and press Enter</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-4 relative z-10">
              <div className="mb-2 flex items-center gap-2 text-cyan-400">
                <FileText className="size-4" />
                <span className="font-semibold">Full Text</span>
              </div>
              <p className="text-sm text-gray-300">Find notes by any text within</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-4 relative z-10">
              <div className="mb-2 flex items-center gap-2 text-cyan-400">
                <Clock className="size-4" />
                <span className="font-semibold">Recent First</span>
              </div>
              <p className="text-sm text-gray-300">Sorted by relevance and recency</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}