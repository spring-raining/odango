# odango

Chinachuを構築
(Ansible + Vagrant(開発用))

## How to deploy

#### Vagrant(開発用)

```bash
$ vagrant box add debian/jessie64
$ vagrant up --provision
$ ansible-playbook -i hosts odango_vagrant_install.yml -vvv
```

#### On-premises

WIP

## References

- http://tolarian-academy.net/christmas-anime-2014/
- https://github.com/YasuhiroKinoshita/chinachu_ansible

## LICENSE

CC0
