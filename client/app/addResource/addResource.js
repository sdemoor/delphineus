angular.module('hackSource.addResource', ['ngMaterial', 'ngSanitize'])

.controller('AddResourceController', function($scope, $mdDialog, User, $http) {
  $scope.customFullscreen = false;

  $scope.loggedIn = false;
  User.checkLoggedIn().then(function(user) {
    if (user.user.id !== undefined) {
      $scope.loggedIn = true;
    }
  });

  var DialogController = function($scope, $mdDialog, $window, Data, User) {
    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    $scope.finish = function() {
      $mdDialog.hide();
      $window.location.reload();
    };

    $scope.selectedTab = 0;

    $scope.prevTab = function() {
      if ($scope.selectedTab === 2) {
        $scope.buttonText = 'NEXT';
      }
      $scope.selectedTab--;
    };

    $scope.buttonText = 'NEXT';

    $scope.nextTab = function(url, tags, title) {
      if ($scope.selectedTab === 0) {
        getMeta(url);
      } else if ($scope.selectedTab === 1) {
        $scope.buttonText = 'SUBMIT';
      } else {
        if (tags) { $scope.data.tags = tags.split(' '); }

        Data.postResource($scope.data);
        $scope.finish();
      }
      $scope.selectedTab++;
    };

     $scope.filesChanged = function(elm){
      $scope.files = elm.files
      $scope.$apply();
    }
    $scope.upload = function() {
      var fd = new FormData()
      angular.forEach($scope.files, function(file){
        fd.append('file', file);
      })
      $http.post('api/load/file', fd,
      {
        transformRequest: angular.identity,
        headers:{'Content-Type':undefined}
      })
      .success(function(d) {
        console.log(d);
        $scope.url = 'https://storage.googleapis.com/hacksource/' + d; //this is the url where the file is saved, since we accept all file types they're all encrypted 8bit octet-stream, so when accessing the URL it gets downloaded and your computer recognizes and automatically decodes/crypts it to the correct file format
      })
    }


    getMeta = function(url) {
      $scope.data = {
        url: url,
        imgUrl: 'https://i.stack.imgur.com/Mmww2.png',
        category: ''
      };

      User.checkLoggedIn().then(function(user) {
        $scope.data.UserId = user.user.id;
      });

      return Data.getMetaDataFor({url: url})
        .then(function(meta) {
          console.log(meta);
          $scope.data.title = meta.title;
          $scope.data.summary = meta.description;
          if (meta.image) {
            if (Array.isArray(meta.image.url)) {
              $scope.data.imgUrl = meta.image.url[meta.image.url.length - 1];
            } else {
              $scope.data.imgUrl = meta.image.url;
            }
          }
        });
    };

    var getCategories = function() {
      Data.getAllCategories()
        .then(function(categories) {
          $scope.categories = categories;
        });
    };
    getCategories();
  };


  $scope.showResourceForm = function(ev) {
    if ($scope.loggedIn) {
      $mdDialog.show({
        controller: DialogController,
        templateUrl: 'app/addResource/addResource.html',
        parent: angular.element(document.body),
        targetEvent: ev,
      })
      .then(function() {}, function() {
        console.log('You chose wrong');
      });
    } else {
      $mdDialog.show(
        $mdDialog.alert()
          .parent(angular.element(document.querySelector('#popupContainer')))
          .clickOutsideToClose(true)
          .title('You are not logged in')
          .htmlContent('<a>Please <a href="/auth/github" class="loginLink">log in</a> to post your resource.</a>')
          .ariaLabel('Please log in')
          .ok('Got it!')
          .targetEvent(ev)
      );
    }
  };
})
.directive('fileInput',['$parse', function($parse){
  return {
    restrict:'A',
    link:function(scope, elm, attrs){
      elm.bind('change', function(){
        $parse(attrs.fileInput)
        .assign(scope, elm[0].files)
        scope.$apply()
      })
    }
  }
}]);


