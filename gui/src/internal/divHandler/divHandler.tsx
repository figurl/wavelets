/* eslint-disable @typescript-eslint/no-explicit-any */
// Import all Div*.tsx components from views directory
const componentModules = import.meta.glob<{ default: any }>(
  "../../views/**/*.tsx",
  {
    eager: true,
  },
);

// Filter for Div*.tsx components and create a mapping of component name to module
const divComponents = Object.fromEntries(
  Object.entries(componentModules)
    .filter(([path]) => path.match(/\/Div[^/]+\.tsx$/))
    .map(([path, module]) => {
      const componentName =
        path
          .split("/")
          .pop()
          ?.replace(/\.tsx$/, "") || "";
      return [componentName, module.default];
    }),
);

const divHandler = ({
  className,
  props,
  children,
}: {
  className: string | undefined;
  props: any;
  children: any;
}) => {
  console.log("--- className:", className, divComponents);
  // Use className directly as the component name
  if (className && divComponents[className]) {
    const Component = divComponents[className];
    return <Component {...props} />;
  }

  return <div {...props}>{children}</div>;
};

export default divHandler;
