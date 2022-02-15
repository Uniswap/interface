export const scrollTo = (targetId) => {
    let el = document.getElementById(targetId);
    if (el) {
        el.scrollIntoView();
    }
};

export const toClassName = (rawString) => {
    let lowerCaseString = rawString.toLowerCase();
    let hyphenatedString = lowerCaseString.split(' ').join('-');
    return hyphenatedString;
}

const listenToScroll = (e, cb) => {
    let scrollPosition = window.scrollY;
    cb(scrollPosition);
}

export const watchPosition = (cb) => {
    window.addEventListener('scroll', (e) => {listenToScroll(e, cb)});
};