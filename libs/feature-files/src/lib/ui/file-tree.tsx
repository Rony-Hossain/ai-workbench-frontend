import React, { useState } from 'react';
import { 
  Folder, ChevronDown, ChevronRight, 
  FileCode, FileJson, FileType, FileTerminal, 
  FileText, LayoutTemplate, Box, GitBranch 
} from 'lucide-react';
import { cn, getLanguageFromFilename } from '@ai-workbench/shared/utils';
import type { FileNode } from '@ai-workbench/bounded-contexts';

// --- 1. Main Container ---
interface FileTreeProps {
  data: FileNode;
  activePath?: string | null;
  onNodeClick: (node: FileNode) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ data, activePath, onNodeClick }) => {
  return (
    <div className="pl-2 select-none font-sans">
      <RenderNode 
        node={data} 
        activePath={activePath} 
        onNodeClick={onNodeClick} 
      />
    </div>
  );
};

// --- 2. Recursive Node Renderer ---
const RenderNode: React.FC<{ 
  node: FileNode; 
  level?: number; 
  activePath?: string | null;
  onNodeClick: (node: FileNode) => void;
}> = ({ node, level = 0, activePath, onNodeClick }) => {
  // Auto-expand root (level 0) and direct children (level 1)
  const [isOpen, setIsOpen] = useState(level < 2); 

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onNodeClick(node);
    }
  };

  const isActive = activePath === node.path;

  return (
    <>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${level * 12}px` }}
        className={cn(
          'group flex items-center gap-1.5 px-2 py-1 rounded-sm cursor-pointer text-xs transition-colors border border-transparent',
          isActive
            ? 'bg-primary/10 text-primary border-primary/20 font-medium'
            : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
        )}
      >
        <span className="opacity-70 shrink-0 flex items-center justify-center">
          <FileIcon node={node} isOpen={isOpen} />
        </span>
        <span className="truncate">{node.name}</span>
      </div>
      
      {isOpen && node.children?.map((child) => (
        <RenderNode 
          key={child.path} 
          node={child} 
          level={level + 1} 
          activePath={activePath}
          onNodeClick={onNodeClick}
        />
      ))}
    </>
  );
};

// --- 3. Enhanced Icon Logic ---
const FileIcon: React.FC<{ node: FileNode; isOpen: boolean }> = ({ node, isOpen }) => {
  if (node.type === 'folder') {
    // Dim system folders
    const isSystem = ['node_modules', '.git', 'dist', 'build', '.next'].includes(node.name);
    return (
      <Folder 
        className={cn(
          "w-3.5 h-3.5 transition-colors", 
          isOpen ? "text-neutral-200" : "text-neutral-500",
          isSystem && "opacity-50"
        )} 
      />
    );
  }

  const lang = getLanguageFromFilename(node.name);

  switch (lang) {
    // Code
    case 'typescript': return <FileCode className="w-3.5 h-3.5 text-blue-400" />;
    case 'javascript': return <FileCode className="w-3.5 h-3.5 text-yellow-300" />;
    case 'python':     return <FileCode className="w-3.5 h-3.5 text-blue-500" />;
    case 'rust':       return <FileCode className="w-3.5 h-3.5 text-orange-600" />;
    
    // Web
    case 'html':       return <LayoutTemplate className="w-3.5 h-3.5 text-orange-500" />;
    case 'css':
    case 'scss':
    case 'less':       return <FileType className="w-3.5 h-3.5 text-sky-300" />;
    
    // Config / Data
    case 'json':       return <FileJson className="w-3.5 h-3.5 text-yellow-500" />;
    case 'yaml':
    case 'toml':       return <FileJson className="w-3.5 h-3.5 text-purple-400" />;
    case 'ini':        return <FileJson className="w-3.5 h-3.5 text-neutral-400" />;
    
    // Shell / Ops
    case 'shell':
    case 'powershell': return <FileTerminal className="w-3.5 h-3.5 text-green-400" />;
    case 'dockerfile': return <Box className="w-3.5 h-3.5 text-blue-600" />;
    case 'gitignore':  return <GitBranch className="w-3.5 h-3.5 text-red-400" />;
    
    // Docs
    case 'markdown':   return <FileText className="w-3.5 h-3.5 text-neutral-200" />;
    case 'text':       return <FileText className="w-3.5 h-3.5 text-neutral-500" />;
    
    default:           return <FileType className="w-3.5 h-3.5 text-neutral-600" />;
  }
};