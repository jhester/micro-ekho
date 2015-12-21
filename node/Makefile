SUPPORT_FILE_DIRECTORY = /Users/jhester/ti/gcc/include

DDEVICE_ID = 1

DEVICE  = msp430fr5728
CC      = msp430-elf-g++
GDB     = msp430-elf-gdb

CSTD_FLAGS = -std=c++11 -funsigned-char
DEBUG_FLAGS = -g -g3 -ggdb -gdwarf-2
ERROR_FLAGS = -Wall -Wextra -Wshadow -Wfatal-errors
NO_ERROR_FLAGS = -Wno-unused-parameter -Wno-unknown-pragmas -Wno-unused-variable -Wno-type-limits -Wno-comment
MSP430_FLAGS = -mmcu=$(DEVICE) -mhwmult=f5series
REDUCE_SIZE_FLAGS = -O0

CXXFLAGS = -I $(SUPPORT_FILE_DIRECTORY) $(CSTD_FLAGS) $(DEBUG_FLAGS) $(ERROR_FLAGS) $(NO_ERROR_FLAGS) $(MSP430_FLAGS) $(REDUCE_SIZE_FLAGS) 
LFLAGS = -L $(SUPPORT_FILE_DIRECTORY)

OBJ = cc1101.o

all: $(OBJ) main.cpp
	$(CC) $(CXXFLAGS) -DDEVICE_ID=$(DDEVICE_ID) $(LFLAGS) $< main.cpp -o main.elf

cc1101.o : cc1101.cpp
	$(CC) -c $(CXXFLAGS) $(LFLAGS) $< -o $@


install: all
	mspdebug rf2500 "prog main.elf"

debug: all
	mspdebug rf2500 gdb &

gdb: 
	$(GDB) -x cmd.gdb

clean: 
	rm -f *.elf *.asm *.o
