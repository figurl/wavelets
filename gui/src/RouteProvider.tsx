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
    if (p === "test") {
      return { type: "test" };
    } else {
      const d = queryParameters.get("d");
      return { type: "content", d: d || "index.md" };
    }
  }, [location.search]);
  const setRoute = useCallback(
    (route: Route) => {
      if (route.type === "content") {
        navigate(`?d=${route.d}`);
      } else if (route.type === "test") {
        navigate(`?p=test`);
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
