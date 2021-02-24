export default class TSApi {
    constructor() {
        this.baseUrl = window.theme_settings.ts_tsapi_base_url;
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

    // Get TS Join Terms and Conditions
    getJoinAgreement() {
        return $.ajax({
            type: 'GET',
            accepts: 'json',
            url: this.fullUrl('/join/tc'),
        });
    }
}
