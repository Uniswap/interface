import React, { Suspense, useEffect, useRef } from 'react';

export const SuspenseFallbackToPreviousContents = (props: { children: React.ReactNode; }) => {
  const lastContents = useRef(props.children);

  useEffect(() => {
    lastContents.current = props.children;
  }, [props.children]);

  return <Suspense fallback={lastContents.current}>{props.children}</Suspense>;
};
