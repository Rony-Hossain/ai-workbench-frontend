export const workspaceApi = {
  openDirectory: async (): Promise<string | null> => {
    if (window.electron) {
      return await window.electron.dialog.openDirectory();
    }
    console.warn("Mocking Directory Picker");
    return '/mock/path/to/project';
  }
};