import {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useMemo,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Route, RouteContext } from "./Route";

const RouteProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const route: Route = useMemo(() => {
    const queryParameters = new URLSearchParams(location.search);
    const p = queryParameters.get("p");
    return { type: "content", p: p || "index.md" };
  }, [location.search]);
  const setRoute = useCallback(
    (route: Route) => {
      if (route.type === "content") {
        navigate(`?p=${route.p}`);
      }
    },
    [navigate],
  );
  return (
    <RouteContext.Provider value={{ route, setRoute }}>
      {children}
    </RouteContext.Provider>
  );
};

export default RouteProvider;
