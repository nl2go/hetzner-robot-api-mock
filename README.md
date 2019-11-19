[![Travis (.org) branch](https://img.shields.io/travis/nl2go/hetzner-robot-api-mock/master)](https://travis-ci.org/nl2go/hetzner-robot-api-mock)
[![Codecov](https://img.shields.io/codecov/c/github/nl2go/hetzner-robot-api-mock)](https://codecov.io/gh/nl2go/hetzner-robot-api-mock)
[![Docker Pulls](https://img.shields.io/docker/pulls/nl2go/hetzner-robot-api-mock)](https://hub.docker.com/r/nl2go/hetzner-robot-api-mock)
[![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/nl2go/hetzner-robot-api-mock)](https://hub.docker.com/repository/docker/nl2go/hetzner-robot-api-mock/tags?page=1)

# Hetzner Robot API Mock

A HTTP server based on [JSON Server](https://github.com/typicode/json-server) that mocks [Hetzner Robot API](https://robot.your-server.de/doc/webservice/en.html).

## Implemented Endpoints

| Name | API Reference |
|------|------|
| `GET /reset` | [get-reset](https://robot.your-server.de/doc/webservice/de.html#reset) |
| `GET /reset/{server-ip}` | [get-reset-server-ip](https://robot.your-server.de/doc/webservice/de.html#get-reset-server-ip) |
| `POST /reset/{server-ip}` | [post-reset-server-ip](https://robot.your-server.de/doc/webservice/de.html#post-reset-server-ip) |
| `GET /boot/{server-ip}/rescue` | [get-boot-server-ip-rescue](https://robot.your-server.de/doc/webservice/de.html#get-boot-server-ip-rescue) |
| `POST /boot/{server-ip}/rescue` | [post-boot-server-ip-rescue](https://robot.your-server.de/doc/webservice/de.html#post-boot-server-ip-rescue) |
| `DELETE /boot/{server-ip}/rescue` | [delete-boot-server-ip-rescue](https://robot.your-server.de/doc/webservice/de.html#delete-boot-server-ip-rescue) |
| `GET /firewall/{server-ip}` | [get-firewall-server-ip](https://robot.your-server.de/doc/webservice/de.html#get-firewall-server-ip) |
| `POST /firewall/{server-ip}` | [post-firewall-server-ip](https://robot.your-server.de/doc/webservice/de.html#post-firewall-server-ip) |
| `DELETE /firewall/{server-ip}` | [delete-firewall-server-ip](https://robot.your-server.de/doc/webservice/de.html#delete-firewall-server-ip) |
| `GET /firewall/template` | [get-firewall-template](https://robot.your-server.de/doc/webservice/de.html#get-firewall-template) |
| `POST /firewall/template` | [post-firewall-template](https://robot.your-server.de/doc/webservice/de.html#post-firewall-template) |
| `GET /firewall/template/{template-id}` | [get-firewall-template-template-id](https://robot.your-server.de/doc/webservice/de.html#get-firewall-template-template-id) |
| `POST /firewall/template/{template-id}` | [post-firewall-template-template-id](https://robot.your-server.de/doc/webservice/de.html#post-firewall-template-template-id) |
| `DELETE /firewall/template/{template-id}` | [delete-firewall-template-template-id](https://robot.your-server.de/doc/webservice/de.html#delete-firewall-template-template-id) |
| `GET /vswitch` | [get-vswitch](https://robot.your-server.de/doc/webservice/de.html#get-vswitch) |
| `POST /vswitch` | [post-vswitch](https://robot.your-server.de/doc/webservice/de.html#post-vswitch) |
| `GET /vswitch/{vswitch-id}` | [get-vswitch-vswitch-id](https://robot.your-server.de/doc/webservice/de.html#get-vswitch-vswitch-id) |
| `POST /vswitch/{vswitch-id}` | [post-vswitch-vswitch-id](https://robot.your-server.de/doc/webservice/de.html#post-vswitch-vswitch-id) |
| `DELETE /vswitch/{vswitch-id}` | [delete-vswitch-vswitch-id](https://robot.your-server.de/doc/webservice/de.html#delete-vswitch-vswitch-id) |


## Authentication

Use username `robot` and password `secret` to authenticate.

## Development

Bootstrap

    npm install
    
Run tests
    
    npm test
    
Run locally

    cd /src/ && node index.js

Run locally built image

    docker-compose up

Rebuild image

    docker-compose build

## Maintainers

- [dirkaholic](https://github.com/dirkaholic)
- [build-failure](https://github.com/build-failure)

## License

See the [LICENSE.md](LICENSE.md) file for details
