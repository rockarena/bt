'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
    'nimbusYoutubeLibrary'
])

.directive('body1', function () {
    return {
        restrict: 'E',
        template: '<div>yoyoyoy1</div>'
    }
})
.directive('body2', function () {
    return {
        restrict: 'E',
        template: '<div>yoyoyoy2</div>'
    }
})
.directive('body3', function () {
    return {
        restrict: 'E',
        template: '<div>yoyoyoy3</div>'
    }
})
.directive('body4', function () {
    return {
        restrict: 'E',
        template: '<div>yoyoyoy4</div>'
    }
}).controller('main',['$scope',function ($scope) {
    $scope.playlistClick = function(n){
        $scope.vc.playVideo(n); 
        $scope.activeVideo = n;
        $('html,body').animate({ scrollTop: $('#videoWindow').offset().top }, 'slow');
    }
    $scope.playVideo = function (where) {
        if (where == 'next' && $scope.activeVideo < 3){
            $scope.activeVideo ++;
            $scope.vc.playNext();
        } else if (where == 'prev' && $scope.activeVideo > 0 ){
            $scope.activeVideo--;
            $scope.vc.playPrev();
        }
    }
}])


