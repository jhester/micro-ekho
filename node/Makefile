SUPPORT_FILE_DIRECTORY = /opt/ti-mspgcc/include

NAME = main
DEVICE  = msp430fr5728
CC      = msp430-elf-g++

CXXFLAGS = -I $(SUPPORT_FILE_DIRECTORY) -mmcu=$(DEVICE) -g -O0 -mhwmult=f5series
LFLAGS = -L $(SUPPORT_FILE_DIRECTORY)

OBJ = cc1101.o

cc1101.o : cc1101.cpp
	$(CC) -c $(CXXFLAGS) $(LFLAGS) $< -o $@

all: cc1101.o
	$(CC) -DDEVICE_ID=1 $(CXXFLAGS) $(LFLAGS) $< $(NAME).cpp -o $(NAME).elf

install: all
	mspdebug rf2500 "prog $(NAME).elf"


clean: 
	rm -f *.elf *.asm *.o
