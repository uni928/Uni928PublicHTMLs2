(() => {
  try {
    const query = location.search;
    const now = Date.now();
    const cacheLimit = 5 * 60 * 1000;
    const queryParts = query ? query.slice(1).split('&') : [];

    // ?1788843986414 や &1788843986414 のような単独のDate.now()値
    const isDateNowValue = value => /^\d{13}$/.test(value);
    const dateNowPart = queryParts.find(isDateNowValue);

    const shouldRedirect =
      !query ||
      (
        dateNowPart !== undefined &&
        now - Number(dateNowPart) >= cacheLimit
      );

    // 先に遷移判定を確定する
    if (shouldRedirect) {
      const otherParts = queryParts.filter(
        part => !isDateNowValue(part)
      );

      const newQuery = [...otherParts, String(now)].join('&');

      location.replace(
        location.pathname + '?' + newQuery + location.hash
      );

      return;
    }

    // 5分以内なら遷移せず、Date.now()部分だけを削除する
    const otherParts = queryParts.filter(
      part => !isDateNowValue(part)
    );

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
