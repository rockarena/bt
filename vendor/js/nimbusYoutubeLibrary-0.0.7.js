/* youtube-playlist -v0.0.7
A Youtube library directive and demo for AngularJS - 2017-12-03
*/
/* global angular */
'use strict';

/**
 * The YouTube playlist module is defined here. This file must be called before the dependent files (controllers etc.)
 */
(function () {
    angular.module('nimbusYoutubeLibrary', []);
})();

/*
Notes:

 Wrap module in an IIFE to remove it from the global scope. This helps prevent variables and function declarations from
 living longer than expected in the global scope, which helps avoid variable collisions.
 */
/* global angular */
'use strict';
(function () {
    angular.module('nimbusYoutubeLibrary')
        .filter('period', function () {
            return function (seconds) {
                if (typeof seconds === 'string') {
                    seconds = parseFloat(seconds);
                }
                if (isNaN(seconds)) {
                    return '--';
                }
                var hours = Math.floor(seconds / 3600.0);
                var rem = seconds - hours * 3600;
                var minutes = Math.floor(rem / 60.0);
                rem = rem - minutes * 60;
                return pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(rem.toFixed(1), 4);
            };

            function pad(s, n) {
                var result = s + '';
                if (result.length < n) {
                    var i;
                    for (i = 0; i < n - result.length; i++) {
                        result = '0' + result;
                    }
                }
                return result;
            }
        });
})();
/* global angular */

'use strict';

/**
 * The Playlist Controller maintains a list of Youtube video IDs as well as some Metadata for display purposes,
 * like titles and descriptions
 */
(function () {
    angular.module('nimbusYoutubeLibrary')
        .controller('PlaylistController', ['YoutubeService', '$q', PlaylistController]);

    function PlaylistController(YoutubeService, $q) {
        var self = this;
        self.titles = {};
        self.descriptions = {};
        self.bodies = {};
        self.titleDescriptions = {};
        self.current = {
            title: 'Nothing playing',
            duration: 0.0,
            description: 'No description',
            id: null
        };
        self.state = { value: -1 };
        self.getPlayer = getPlayer;
        self.getPlaylistIDs = getPlaylistIDs;
        self.getCurrentlyPlayingInfo = getCurrentlyPlayingInfo;
        self.createPlaylist = createPlaylist;
        self.playNext = playNext;
        self.playPrev = playPrev;
        self.playVideo = playVideo;
        self.getTitles = getTitles;
        self.getBodies = getBodies;
        self.getDescriptions = getDescriptions;
        self.getInfoFor = getInfoFor;
        self.getTitleAndDescriptions = getTitleAndDescriptions;
        self._playerPromise = null;

        function onStateChange(event) {
            self.state.value = event.data;
            getCurrentlyPlayingInfo().then(setCurrent);
        }

        /**
         * Returns a promise for a YouTube player instance. Each controller maintains a single instance of YT.Player,
         * so multiple calls to this method will resolve to the same object.
         * @return {Promise|{player}}
         */
        function getPlayer(id, width, height) {
            if (!self._playerPromise) {
                console.log('Requesting new player instance');
                self._playerPromise = YoutubeService.getPlayer(id, width, height, onStateChange);
            }
            return self._playerPromise;
        }

        /**
         * Like it says, it takes the YT.Player method call and wraps it inside a promise that is resolved when that
         * function returns
         * @param functionName
         * @return {Function}
         */
        function wrapPlayerCallInPromise(functionName) {
            var q = $q.defer();
            self.getPlayer().then(function (player) {
                q.resolve(player[functionName]());
            });
            return q.promise;
        }

        /**
         * Returns a promise that resolves to the video ID list of the current playlist
         * @return {Promise}
         */
        function getPlaylistIDs() {
            return wrapPlayerCallInPromise('getPlaylist');
        }

        /**
         * Returns a promise that resolves to the current video information, or null, if no video is playing.
         * @return {Promise}
         */
        function getCurrentlyPlayingInfo() {
            var q = $q.defer();
            self.getPlayer().then(function (player) {
                if (self.state.value > 0) {
                    var duration = player.getDuration();
                    var ids = player.getPlaylist();
                    var index = player.getPlaylistIndex();
                    var id = ids[index];
                    q.resolve({
                        id: id,
                        title: self.titles[id],
                        mbody: self.bodies[id],
                        description: self.descriptions[id],
                        duration: duration
                    });
                } else {
                    q.resolve({
                        id: null,
                        title: 'Nothing playing',
                        description: '',
                        mbody: '',
                        duration: 0.0
                    });
                }
            });
            return q.promise;
        }

        /**
         * Creates a new playlist for the YT.Player instance. Also additional metadata for the titles and descriptions
         * are stored locally for display purposes
         * @param {Array} ids - a list of video ID strings
         * @param {Array} titles - Custom titles for the video IDs. Must be same length and order as ids
         * @param {Array} descriptions - optional. Description HTML strings. Must be same length and order as ids
         */
        function createPlaylist(ids, titles, descriptions, bodies) {
            if (!ids) {
                throw new Error('ids must be provided when adding a playlist entry');
            }
            if (!titles) {
                throw new Error('Titles must be provided when adding a playlist entry');
            }
            angular.copy({}, self.titles);
            angular.copy({}, self.descriptions);
            angular.copy({}, self.titleDescriptions);
            angular.copy({}, self.bodies);
            var i;
            for (i = 0; i < ids.length; i++) {
                self.titles[ids[i]] = titles[i];
                self.bodies[ids[i]] = bodies[i];
                if (descriptions) {
                    self.descriptions[ids[i]] = descriptions[i];
                } else {
                    self.descriptions[ids[i]] = '';
                }
                self.titleDescriptions[ids[i]] = {
                    title: titles[i],
                    description: self.descriptions[ids[i]]
                }
            }
            var q = $q.defer();
            self.getPlayer().then(function (player) {
                player.cuePlaylist({
                    playlist: ids
                });
                q.resolve(true);
            });
            return q.promise;
        }

        function setCurrent(info) {
            self.current.id = info.id;
            self.current.title = info.title;
            self.current.description = info.description;
            self.current.mbody = info.mbody;
            self.current.duration = info.duration;
        }

        function playNext() {
            wrapPlayerCallInPromise('nextVideo');
        }

        function playPrev() {
            wrapPlayerCallInPromise('previousVideo');
        }

        function playVideo(index) {
            var q = $q.defer();
            self.getPlayer().then(function (player) {
                player.playVideoAt(index);
                getCurrentlyPlayingInfo().then(function (info) {
                    setCurrent(info);
                    q.resolve();
                });
            });
            return q.promise;
        }

        function getTitles() {
            return self.titles;
        }

        function getBodies() {
            return self.bodies;
        }

        function getDescriptions() {
            return self.descriptions;
        }

        function getTitleAndDescriptions() {
            return self.titleDescriptions;
        }

        function getInfoFor(index) {
            var q = $q.defer();
            self.getPlayer().then(function (player) {
                var ids = player.getPlaylist();
                if (!ids) {
                    q.resolve(null);
                } else {
                    var id = index < ids.length ? ids[index] : null;
                    if (id) {
                        q.resolve({
                            id: id,
                            title: self.titles[id],
                            description: self.descriptions[id],
                            mbody: self.mbody[id]
                        });
                    } else {
                        q.resolve(null);
                    }
                }
            });
            return q.promise;
        }
    }
})();

/*
 Notes:
 Wrap module in an IIFE to remove it from the global scope. This helps prevent variables and function declarations from
 living longer than expected in the global scope, which helps avoid variable collisions.
 */
/* global angular */

'use strict';

(function () {
    angular.module('nimbusYoutubeLibrary')
        .directive('nimbusYoutubePlayer', function () {
            return {
                restrict: 'E',
                scope: false,
                transclude: true,
                controller: 'PlaylistController',
                controllerAs: 'vc',
                template: '<div class="youtube-player" ng-transclude></div>',
                link: linkPlayer
            };
        })
        .directive('nimbusPlaylist', function () {
            return {
                restrict: 'E',
                replace: true,
                require: '^nimbusYoutubePlayer',
                scope: {},
                controller: ['$scope', function ($scope) {
                    $scope.videoIds = [];
                    $scope.titles = [];
                    $scope.descriptions = [];
                    $scope.bodies = [];

                    this.addEntry = function (entry) {
                        $scope.videoIds.push(entry.id);
                        $scope.titles.push(entry.title);
                        $scope.descriptions.push(entry.description || '');
                        $scope.bodies.push(entry.mbody || '');
                        console.log('Added playlist entry: ' + entry.id);
                    };
                }],
                link: function (scope, element, attrs, vc) {
                    scope.$on('youtubePlayerReady', function () {
                        vc.createPlaylist(scope.videoIds, scope.titles, scope.descriptions, scope.bodies);
                    });
                }
            };
        })
        .directive('entry', function () {
            return {
                restrict: 'E',
                replace: true,
                require: '^nimbusPlaylist',
                scope: {
                    id: "@",
                    title: "@",
                    description: "@",
                    mbody: "@"
                },
                link: function (scope, element, attrs, pc) {
                    pc.addEntry(scope);
                }
            };
        });

    function linkPlayer(scope, element, attrs, vc) {
        var width = attrs.width;
        var height = attrs.height;
        var targetId = attrs.target;
        scope.$on('youtubeServiceReady', function () {
            console.log('Attaching player on ' + targetId + ' with ' + width + 'x' + height);
            vc.getPlayer(targetId, width, height).then(function () {
                console.log('Player attached');
            }, function (err) {
                console.log('Error getting player:', err);
            });
        });
    }
})();
/* global angular */

(function () {
    angular.module('nimbusYoutubeLibrary').factory('YoutubeService', ['$rootScope', '$q', '$window', YoutubeService]);

    function YoutubeService($rootScope, $q, $window) {
        var document = $window.document;
        $window.onYouTubeIframeAPIReady = applyServiceIsReady;
        var script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
        var service = { ready: false };

        function applyServiceIsReady() {
            console.log('YT library is ready');
            service.ready = true;
            $rootScope.$broadcast('youtubeServiceReady');
        }

        function getPlayer(elementId, width, height, onPlayerStateChange) {
            console.log(service);
            if (!service.ready) {
                return $q.reject('YouTube service is not ready. Cannot create player');
            }
            var q = $q.defer();
            var options = {
                height: height,
                width: width,
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange,
                    'onError': onPlayerError
                }
            };
            new YT.Player(elementId, options);
            function onPlayerReady(event) {
                $rootScope.$broadcast('youtubePlayerReady');
                q.resolve(event.target);
            }

            function onPlayerError(error) {
                var msg;
                switch (error.data) {
                    case 2:
                        msg = "The request contains an invalid parameter value.";
                        break;
                    case 5:
                        msg = "The requested content cannot be played in an HTML5 player";
                        break;
                    case 100:
                    case 150:
                        msg = "The video requested was not found.";
                        break;
                }
                q.reject(new Error('Could not create new YouTube player because ' + msg));
            }

            return q.promise;
        }

        service.getPlayer = getPlayer;
        return service;
    }
})();