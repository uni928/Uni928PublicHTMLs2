(() => {
  try {
    const query = location.search;
    const now = Date.now();
    const cacheLimit = 5 * 60 * 1000;

    const queryParts = query
      ? query.slice(1).split('&').filter(Boolean)
      : [];

    const isDateNowValue = value => /^\d{13}$/.test(value);

    const dateNowParts = queryParts.filter(isDateNowValue);
    const latestDateNow = dateNowParts.at(-1);

    const otherParts = queryParts.filter(
      part => !isDateNowValue(part)
    );

    const hasDateNow = latestDateNow !== undefined;
    const isExpired =
      hasDateNow &&
      now - Number(latestDateNow) >= cacheLimit;

    // クエリがない、またはDate.now()がない場合は必ず付与する
    if (!hasDateNow || isExpired) {
      const newQuery = [
        ...otherParts,
        String(now)
      ].join('&');

      location.replace(
        location.pathname + '?' + newQuery + location.hash
      );

      return;
    }

    // Date.now()が5分以内なら遷移せず、Date.now()部分だけ削除する
    const cleanedQuery = otherParts.length
      ? '?' + otherParts.join('&')
      : '';

    if (cleanedQuery !== query) {
      history.replaceState(
        history.state,
        '',
        location.pathname + cleanedQuery + location.hash
      );
    }
  } catch (error) {
    console.error(error);
  }
})();
