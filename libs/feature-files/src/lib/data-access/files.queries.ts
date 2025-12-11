import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileSystemApi } from './files.service';

// 1. Hook to GET the file tree (The missing export!)
export const useFileTree = (path: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['files', path],
    queryFn: () => {
      if (!path) return null;
      return fileSystemApi.readDir(path);
    },
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false && !!path,
  });
};

// 2. Hook to READ file content
export const useFileContent = (path: string | null) => {
  return useQuery({
    queryKey: ['file-content', path],
    queryFn: async () => {
      if (!path) return '';
      console.log('📖 Reading File:', path);
      return await fileSystemApi.readFile(path);
    },
    enabled: !!path, // Only run if a path is selected
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });
};

// 3. Hook to WRITE file content
export const useFileSave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ path, content }: { path: string; content: string }) => {
      console.log('💾 Saving File:', path);
      await fileSystemApi.writeFile(path, content);
    },
    onSuccess: (_, variables) => {
      // Update the cache immediately so the UI reflects the save
      queryClient.setQueryData(['file-content', variables.path], variables.content);
    },
  });
};
