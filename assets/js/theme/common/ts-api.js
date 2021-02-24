export default class TSApi {
    constructor() {
        this.baseUrl = window.theme_settings.ts_tsapi_base_url;

        console.log("BASE URL", this.baseUrl);
    }

    fullUrl(uri) {
        return this.baseUrl + uri;
    }

    // Get Sponsor
    getSponsor(params) {
        const uri = `/search/join/${params}`;

        return $.ajax({
            type: 'GET',
            accepts: 'json',
            url: this.fullUrl(uri),
        });
    }
}
