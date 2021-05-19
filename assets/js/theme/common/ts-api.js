export default class TSApi {
    constructor() {
        this.tsapiUrl = window.theme_settings.ts_tsapi_base_url;
        this.joinUrl = window.theme_settings.ts_join_api_base_url;
    }

    fullTSApiUrl(uri) {
        return this.tsapiUrl + uri;
    }

    fullJoinUrl(uri) {
        return this.joinUrl + uri;
    }

    // Get Sponsor
    getSponsor(params) {
        const uri = `/search/join/${params}`;

        return $.ajax({
            type: 'GET',
            accepts: 'json',
            url: this.fullTSApiUrl(uri),
        });
    }

    // Get TS Join Terms and Conditions
    getJoinAgreement() {
        return $.ajax({
            type: 'GET',
            accepts: 'json',
            url: this.fullTSApiUrl('/join/tc'),
        });
    }

    joinSignUp(payload) {
        return $.ajax({
            type: 'POST',
            accepts: 'json',
            contentType: 'application/json',
            url: this.fullJoinUrl('/join/signup'),
            data: JSON.stringify(payload),
        });
    }
}
