# Configurate `isolate` on a given Linux machine.

# Removes an existent configuration
rm /usr/bin/isolate
rm -r ~/cbin

# Store the binaries in ~/cbin
mkdir ~/cbin
cp isolate ~/cbin/

# Symlink ~/cbin/ to /usr/bin
ln -s ~/cbin/isolate /usr/bin/isolate

# Fire up `isolate`
isolate --init

# Adds python2, python3 and ruby to the box
ln -s /usr/bin/python2 /tmp/box/0/box/python2
ln -s /usr/bin/python3 /tmp/box/0/box/python3
ln -s /usr/bin/ruby /tmp/box/0/box/ruby
