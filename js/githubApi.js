const gitHubApi = {
  getReposByName: async (query, options) => {
    const timeout = options ? options.timeout : 10000;
    const apiURL = 'https://api.github.com/search/repositories';
    const defaultQuery = '&sort=stars&order=desc&per_page=5';

    const fetchURL = `${apiURL}?q=${query}${defaultQuery}`;
    const controller = new AbortController();
    const requestTimeout = setTimeout(() => {
      controller.abort();
      console.log('Request timed out');
    }, timeout);

    const fetchOptions = {
      ...options,
      timeout,
      signal: controller.signal,
    }
    try {
      return await fetch(fetchURL, fetchOptions)
        .then((response) => {
          if (!response.ok) throw new Error(`${response.status}${response.statusText}`);
          clearTimeout(requestTimeout);
          return response.json();
        });
    } catch (error) {
      if (error.name === "AbortError" && console.error("Request timed out")) throw new Error('Request timed out', {cause: error});
      throw new Error('Something went wrong', {cause:error});
    }
    
  },
};

export default gitHubApi;
