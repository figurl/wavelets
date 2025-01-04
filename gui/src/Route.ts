import { createContext, useContext } from "react";

export type Route = {
  type: "content";
  p: string;
};

type RouteContextType = {
  route: Route;
  setRoute: (route: Route) => void;
};

export const RouteContext = createContext<RouteContextType>({
  route: { type: "content", p: "" },
  setRoute: () => {},
});

export const useRoute = () => {
  const { route, setRoute } = useContext(RouteContext);
  return { route, setRoute };
};
