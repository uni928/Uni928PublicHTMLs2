<script>
(() => {
  try {
    const now = Date.now();
    const cacheLimit = 5 * 60 * 1000;
    const storageKey = 'html_cache_bust_time';
    const cacheParam = '_cb';

    const lastTime = Number(sessionStorage.getItem(storageKey)) || 0;

    const url = new URL(location.href);
    const currentCacheValue = url.searchParams.get(cacheParam);

    // 5分以上経過している場合だけキャッシュバスト
    if (now - lastTime >= cacheLimit) {
      sessionStorage.setItem(storageKey, String(now));

      url.searchParams.set(cacheParam, String(now));

      location.replace(url.href);
      return;
    }

    // キャッシュバスト後はURLから _cb だけ削除
    if (currentCacheValue !== null) {
      url.searchParams.delete(cacheParam);

      history.replaceState(
        history.state,
        '',
        url.pathname + url.search + url.hash
      );
    }
  } catch (error) {
    console.error(error);
  }
})();
</script>
