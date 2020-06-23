import $ from 'jquery';

export default class ErrorHandler {

    private errorContainer?: JQuery<HTMLElement>;
    public resumeErrorCallback?: Function;
    public hideDiv?: JQuery<HTMLElement>;

    constructor(hideDiv?: JQuery<HTMLElement>) {
        this.hideDiv = hideDiv;
        this.resumeError = this.resumeError.bind(this);
        this.catchError = this.catchError.bind(this);
    }

    public resumeError() {
        $('#error-container').remove();
        if (this.hideDiv)
            this.hideDiv.removeClass('ghost');
        if (this.resumeErrorCallback) this.resumeErrorCallback();
    }

    public catchError(err: string) {
        if (this.hideDiv)
            this.hideDiv.addClass('ghost');
        this.displayError(err);
    }

    private displayError(err: string) {
        $('#error-container').remove();
        this.errorContainer = $(`
            <div id="error-container" class="card bg-danger text-white mb-3 p-3">
                <h3 class="card-title">Erreur</h3>
                <p class="card-text" id="error-body">${err}</p>
                <button id="error-resume" class="card-link btn btn-warning">Réessayer</button>
            </div>
        `);
        $('div.container:first').prepend(this.errorContainer);
        $('#error-resume').one('click', this.resumeError);
    }

}
