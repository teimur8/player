$(document).ready(function () {
    // For TV Series
    const episodeAnchors = $('.newsEp-list a')
    if (episodeAnchors.length > 0) {
        episodeAnchors.click(function () {
            console.log('Pause clicked')
            $('video').each(function (i, video) {
                if (!video.paused) {
                    video.pause()
                }
            })
        })

        $('.newsEp-content').keyup(function (e) {
            if (' ' === e.key) {
                const video = $(this).find('video')[0]
                if (video.paused) {
                    video.play()
                }
                else {
                    video.pause()
                }
            }
        })
    }

    // Change speed
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.8, 2.4]
    $('.newsEp-contents').keyup(function (e) {
        const video = $(this).find('video')[0]
        const speedIndex = speeds.indexOf(video.playbackRate)
        switch (e.key) {
            case '_':
            case '-':
                if (speedIndex > 0) {
                    video.playbackRate = speeds[speedIndex - 1]
                }
                break

            case '=':
            case '+':
                if (speedIndex < speeds.length - 1) {
                    video.currentTime = speeds[speedIndex + 1]
                }
                break
        }
    })
})
