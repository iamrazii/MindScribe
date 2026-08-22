import { createBrowserRouter } from "react-router";
import { DashboardLayout } from "./components/dashboard-layout";
import { DashboardHome } from "./components/pages/dashboard-home";
import { CreateNote } from "./components/pages/create-note";
import { ViewNotes } from "./components/pages/view-notes";
import { ViewSingleNote } from "./components/pages/view-single-note";
import { EditNote } from "./components/pages/edit-note";
import { SummarizeNote } from "./components/pages/summarize-note";
import { EvaluateNote } from "./components/pages/evaluate-note";
import { SearchNotes } from "./components/pages/search-notes";
import { DeleteNote } from "./components/pages/delete-note";
import { KnowledgeMap } from "./components/pages/knowledge-map";
import { Chatbot } from "./components/pages/chatbot";
import { Messages } from "./components/pages/messages"; // Imported Messages
import { Profile } from "./components/pages/profile";

export const createRouter = (user: any, onLogout: () => void) =>
  createBrowserRouter([
    {
      path: "/",
      element: <DashboardLayout user={user} onLogout={onLogout} />,
      children: [
        { index: true, element: <DashboardHome /> },
        { path: "create", element: <CreateNote /> },
        { path: "view", element: <ViewNotes /> },
        { path: "view-note", element: <ViewSingleNote /> },
        { path: "edit-note", element: <EditNote /> },
        { path: "messages", element: <Messages /> }, 
        { path: "summarize", element: <SummarizeNote /> },
        { path: "evaluate", element: <EvaluateNote /> },
        { path: "search", element: <SearchNotes /> },
        { path: "delete", element: <DeleteNote /> },
        { path: "knowledge-map", element: <KnowledgeMap /> },
        { path: "chatbot", element: <Chatbot /> },
        { path: "profile", element: <Profile /> },
      ],
    },
  ]);