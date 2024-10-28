fn func_difficult_if(a: i32, b: i32, c: i32) -> i32 {
    if a > b {
        if a > c {
            a
        } else {
            c
        }
    } else if a == b && a == c {
        0
    } else {
        if b > c {
            b
        } else {
            c
        }
    }
}