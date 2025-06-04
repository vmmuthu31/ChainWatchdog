interface Chrome {
  storage: {
    local: {
      get: (key: string) => Promise<{ [key: string]: any }>;
      set: (items: { [key: string]: any }) => Promise<void>;
    };
  };
}

declare var chrome: Chrome;
