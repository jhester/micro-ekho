SUPPORT_FILE_DIRECTORY = /opt/ti-mspgcc/include

DEVICE  = msp430fr5728
CC      = msp430-elf-g++

CXXFLAGS = -I $(SUPPORT_FILE_DIRECTORY) -mmcu=$(DEVICE) -g -O0 -mhwmult=none -std=c++11
LFLAGS = -L $(SUPPORT_FILE_DIRECTORY)

OBJ = cc1101.o

cc1101.o : cc1101.cpp
	$(CC) -c $(CXXFLAGS) $(LFLAGS) $< -o $@

all: $(OBJ)
	$(CC) $(CXXFLAGS) -DDEVICE_ID=3 $(LFLAGS) $< main.cpp -o main.elf

install: all
	mspdebug rf2500 "prog main.elf"

debug: all
	mspdebug rf2500 gdb &
	msp430-elf-gdb -x cmd.gdb

clean: 
	rm -f *.elf *.asm *.o
