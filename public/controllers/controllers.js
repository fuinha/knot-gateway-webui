/*global app*/

app.controller('SigninController', function ($scope, $state, SigninService) {
  $scope.signin = function signin() {
    SigninService.signin($scope.form)
      .then(function onSuccess() {
        $state.go('app.admin');
      }, function onError() {
        alert('Authentication Error');
      });
  };
});

app.controller('AdminController', function ($rootScope, $scope, $location, $state, AppService) {
  var formData = {
    password: null,
    passwordConfirmation: null,
    remoteSshPort: null,
    allowedPassword: true,
    sshKey: null,
    currentFirmware: null,
    newFirmware: null,
    newFirmware64Base: null
  };

  $rootScope.activetab = $location.path();

  $scope.init = function () {
    AppService.loadAdmInfo()
      .then(function onSuccess(result) {
        formData.remoteSshPort = result.remoteSshPort;
        formData.allowedPassword = result.allowedPassword;
        formData.sshKey = result.sshKey;
        formData.currentFirmware = result.firmware;
      }, function onError(err) {
        console.log(err);
      });

    $scope.form = formData;
  };

  $scope.save = function () {
    var config = {
      password: $scope.form.password,
      remoteSshPort: $scope.form.remoteSshPort,
      allowedPassword: $scope.form.allowedPassword,
      sshKey: $scope.form.sshKey,
      firmware: { name: $scope.form.newFirmware, base64: $scope.form.newFirmware64Base }
    };

    if ($scope.form.password === $scope.form.passwordConfirmation) {
      AppService.saveAdmInfo(config)
        .then(function onSuccess(/* result */) {
          alert('Information saved');
        }, function onError(err) {
          alert(err);
        });
    } else {
      alert('Password does not match');
    }
  };

  $scope.reboot = function reboot() {
    AppService.reboot()
    .then(function onSuccess(result) {
      AppService.gatewayIp = result.data.gatewayIp;
      $state.go('app.reboot');
    }, function onError() {
      alert('Failed to reboot the gateway');
    });
  };

  $scope.restore = function restore() {
    AppService.restore()
    .then(function onSuccess(result) {
      AppService.gatewayIp = result.data.gatewayIp;
      $state.go('app.reboot');
    }, function onError() {
      alert('Failed to restore the gateway');
    });
  };
});

app.controller('NetworkController', function ($rootScope, $scope, $location, $state, AppService) {
  var networkData = {
    hostname: null,
    ipaddress: null,
    networkMask: null,
    defaultGateway: null,
    primarydns: null,
    secondarydns: null
  };

  $rootScope.activetab = $location.path();

  $scope.readonlyip = true;
  $scope.readonlydns = true;

  $scope.$watch('automaticIp', function (/* value */) {
    $scope.readonlyip = ($scope.automaticIp === 'true');
  });

  $scope.$watch('automaticDns', function (/* value */) {
    $scope.readonlydns = ($scope.automaticDns === 'true');
  });

  $scope.init = function () {
    AppService.loadNetworkInfo()
      .then(function onSuccess(result) {
        networkData.hostname = result.hostname !== '' ? result.hostname : null;
        networkData.ipaddress = result.ipaddress !== '' ? result.ipaddress : null;
        networkData.networkMask = result.networkMask !== '' ? result.networkMask : null;
        networkData.defaultGateway = result.defaultGateway !== '' ? result.defaultGateway : null;
        $scope.automaticIp = result.automaticIp ? 'true' : 'false';
        networkData.primarydns = result.primarydns !== '' ? result.primarydns : null;
        networkData.secondarydns = result.secondarydns !== '' ? result.secondarydns : null;
        $scope.automaticDns = result.automaticDns ? 'true' : 'false';
      }, function onError(err) {
        console.log(err);
      });

    $scope.form = networkData;
  };

  $scope.save = function () {
    var networkConfig = {
      hostname: $scope.form.hostname,
      ipaddress: $scope.form.ipaddress,
      networkMask: $scope.form.networkMask,
      defaultGateway: $scope.form.defaultGateway,
      automaticIp: ($scope.automaticIp === 'true')
    };

    AppService.saveNetworkInfo(networkConfig)
      .then(function onSuccess(result) {
        AppService.gatewayIp = result.data.gatewayIp;
        $state.go('app.reboot');
      }, function error(err) {
        alert(err);
      });
  };
});

app.controller('DevicesController', function ($rootScope, $scope, $location, AppService) {
  var MAX_LENTGH = 5;

  $rootScope.activetab = $location.path();

  $scope.init = function () {
    AppService.loadDevicesInfo()
      .then(function onSuccess(result) {
        $scope.macAddresses = result;
      }, function onError() {
        console.log('Error loading devices');
      });
  };

  $scope.add = function () {
    var tmp;
    if ($scope.macAddresses.keys.length === MAX_LENTGH) {
      alert('No space left for new device');
    } else {
      tmp = $scope.macAddresses.keys.find(function (key) {
        return key.mac === $scope.form.mac;
      });
      if (tmp !== undefined) {
        alert('MAC already in use');
      } else {
        $scope.macAddresses.keys.push({ name: $scope.form.name, mac: $scope.form.mac });
        AppService.saveDevicesInfo($scope.macAddresses)
          .catch(function onError() {
            $scope.macAddresses.keys.pop();
            console.log('Error on access to keys file');
          });
      }
    }
    $scope.form.name = null;
    $scope.form.mac = null;
  };

  $scope.remove = function (key) {
    var pos = $scope.macAddresses.keys.lastIndexOf(key);
    var tmp = $scope.macAddresses.keys.splice(pos, 1);
    AppService.saveDevicesInfo($scope.macAddresses)
      .catch(function onError() {
        $scope.macAddresses.keys.splice(pos, 0, tmp);
        console.log('Error on access to keys file');
      });
  };
});

app.controller('RebootController', function ($scope, $location, $interval, $state, $window, AppService) {
  $scope.progress = function progress() {
    var promise;
    var MINUTE = 60000;
    $scope.countup = 0;
    promise = $interval(function onInterval() {
      if ($scope.countup >= 100) {
        $interval.cancel(promise);
        $window.location.href = 'http://' + AppService.gatewayIp + ':8080';
      } else {
        $scope.countup += 1;
      }
    }, MINUTE / 100);
  };
});

app.controller('MainController', function ($rootScope, $location) {
  $rootScope.activetab = $location.path();
});

app.controller('RadioController', function ($rootScope, $scope, $location, AppService) {
  var formData = {
    channel: null,
    outputPower: null,
    mac: null
  };

  $rootScope.activetab = $location.path();

  $scope.init = function () {
    AppService.loadRadioInfo()
      .then(function onSuccess(result) {
        formData.channel = result.channel;
        formData.outputPower = result.TxPower;
        formData.mac = result.mac;
      }, function onError(err) {
        console.log(err);
      });

    $scope.form = formData;
  };

  $scope.save = function () {
    var config = {
      channel: $scope.form.channel,
      TxPower: $scope.form.outputPower
    };

    AppService.saveRadioInfo(config)
      .then(function onSuccess(/* result */) {
        alert('Information saved');
      }, function onError(err) {
        alert(err);
      });
  };
});

app.controller('CloudController', function ($rootScope, $location) {
  $rootScope.activetab = $location.path();
});
