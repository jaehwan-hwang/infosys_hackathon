"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "./api";

/**
 * 백엔드 호출에 필요한 액세스 토큰과 로그인 상태를 한 곳에서 꺼내 쓴다.
 */
export function useAuth() {
  const { data: session, status, update } = useSession();

  return {
    session,
    token: session?.accessToken,
    user: session?.user,
    role: session?.user?.role,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated" && Boolean(session?.accessToken),
    /** 프로필(학번) 입력이 아직 안 된 상태 */
    needsProfile: status === "authenticated" && session?.user?.profileCompleted === false,
    /** 토큰 교환 실패 사유 */
    authError: session?.authError,
    refresh: update,
  };
}

type AsyncState<T> = {
  data: T | undefined;
  error: string | undefined;
  loading: boolean;
};

/**
 * 토큰이 준비된 뒤에 한 번 실행되는 데이터 로더.
 *
 * 언마운트된 뒤 상태를 갱신하지 않도록 AbortController로 정리하고,
 * deps가 바뀌면 이전 요청을 취소한 뒤 다시 부른다.
 */
export function useApiQuery<T>(
  fetcher: ((signal: AbortSignal) => Promise<T>) | null,
  deps: unknown[],
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: undefined,
    error: undefined,
    loading: Boolean(fetcher),
  });
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const run = fetcherRef.current;
    if (!run) {
      setState({ data: undefined, error: undefined, loading: false });
      return;
    }

    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    run(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({ data, error: undefined, loading: false });
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        // 취소된 요청은 오류로 표시하지 않는다
        if (e instanceof DOMException && e.name === "AbortError") return;
        setState({
          data: undefined,
          error: e instanceof ApiError ? e.message : "데이터를 불러오지 못했습니다.",
          loading: false,
        });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { ...state, reload };
}

/**
 * 폼 제출처럼 사용자가 직접 일으키는 요청의 상태를 관리한다.
 */
export function useApiMutation<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | undefined>();

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      setPending(true);
      setError(undefined);
      try {
        return await action(...args);
      } catch (e) {
        setError(
          e instanceof ApiError
            ? e
            : new ApiError("요청을 처리하지 못했습니다.", 0),
        );
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [action],
  );

  return { run, pending, error, clearError: () => setError(undefined) };
}
