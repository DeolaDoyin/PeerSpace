import React, { createContext, useContext, useState } from "react";

type CreatePostContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const CreatePostContext = createContext<CreatePostContextType | undefined>(
  undefined,
);

export const CreatePostProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <CreatePostContext.Provider value={{ open, setOpen }}>
      {children}
    </CreatePostContext.Provider>
  );
};

export const useCreatePostModal = () => {
  const ctx = useContext(CreatePostContext);
  if (!ctx)
    throw new Error(
      "useCreatePostModal must be used within CreatePostProvider",
    );
  return ctx;
};

export default CreatePostContext;
