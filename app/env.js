(function (window) {
    window.__env = window.__env || {};
    // Here I am using the environment variable to keep my api key and api urls safe
    window.__env.converterApiUrl = 'https://xecdapi.xe.com/v1/convert_from.json/';
    window.__env.converterApiKey = 'Basic d2Fzc2VsbGluZHVzdHJpZXM5MDkxMDE0MTE6NzJnajY0MDFibHFyY285c2t1YzhkMDNoaXM';


    window.__env.historicalApiUrl = 'https://xecdapi.xe.com/v1/historic_rate/period.json/';
    window.__env.historicalApiKey = 'Basic d2Fzc2VsbGluZHVzdHJpZXM5MDkxMDE0MTE6NzJnajY0MDFibHFyY285c2t1YzhkMDNoaXM';

    //window.__env.historicalApiUrl = 'http://globalcurrencies.xignite.com/xGlobalCurrencies.json/';
    //window.__env.historicalApiKey = '_token=AAF07529B97D48F2B632704862A9048D';

}(this));