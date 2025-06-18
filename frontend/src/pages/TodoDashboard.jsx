import React, { useState } from "react";
import { List, FolderOpen, Menu, X } from "lucide-react";

// Import your separate components here when using in your project
// Example: import TodoList from './TodoList';
// Example: import ProjectTodo from './ProjectTodo';

import TodoList from "./TodoList";
import ProjectTodo from "./ProjectList";

const Sidebar = ({ isExpanded, setIsExpanded, activeItem, setActiveItem }) => {
  const menuItems = [
    {
      id: "todoList",
      label: "Todo List",
      icon: List,
    },
    {
      id: "projectTodo",
      label: "Project Todo",
      icon: FolderOpen,
    },
  ];

  return (
    <div
      className={`h-screen bg-gradient-to-b from-slate-900 to-slate-800 shadow-xl flex flex-col transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-16"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <div
          className={`transition-opacity duration-300 ${
            isExpanded ? "opacity-100" : "opacity-0"
          }`}
        >
          {isExpanded && (
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Dashboard
              </h2>
              <p className="text-slate-400 text-sm mt-1">Manage your tasks</p>
            </div>
          )}
        </div>

        {/* Hamburger Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200"
        >
          {isExpanded ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                transition-all duration-200 ease-in-out group relative
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-105"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:scale-102"
                }
                ${!isExpanded ? "justify-center" : ""}
              `}
              title={!isExpanded ? item.label : ""}
            >
              <IconComponent
                size={20}
                className={`
                  transition-transform duration-200 flex-shrink-0
                  ${isActive ? "scale-110" : "group-hover:scale-105"}
                `}
              />
              {isExpanded && (
                <span className="font-medium text-sm transition-opacity duration-300">
                  {item.label}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {!isExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        {isExpanded && (
          <div className="text-xs text-slate-500 text-center transition-opacity duration-300">
            Stay organized, stay productive
          </div>
        )}
      </div>
    </div>
  );
};

const TodoDashboard = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeItem, setActiveItem] = useState("todoList");

  const renderMainContent = () => {
    switch (activeItem) {
      case "todoList":
        // return <TodoList />;
        return <TodoList />;
      case "projectTodo":
        // return <ProjectTodo />;
        return <ProjectTodo />;
      default:
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-800">Welcome</h1>
            <p className="text-gray-600 mt-2">
              Select a menu item from the sidebar
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />
      <main className="flex-1 bg-gray-50 overflow-auto">
        {renderMainContent()}
      </main>
    </div>
  );
};

export default TodoDashboard;
