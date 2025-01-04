import { createContext, useContext } from "react";

export type Route =
  | {
      type: "content";
      d: string;
    }
  | {
      type: "test";
    };

type RouteContextType = {
  route: Route;
  setRoute: (route: Route) => void;
};

export const RouteContext = createContext<RouteContextType>({
  route: { type: "content", d: "" },
  setRoute: () => {},
});

export const useRoute = () => {
  const { route, setRoute } = useContext(RouteContext);
  return { route, setRoute };
};
