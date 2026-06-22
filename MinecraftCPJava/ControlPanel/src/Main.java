import java.util.Scanner;
public class Main {
    public static void main(String[] args) throws Exception {
        Scanner input = new Scanner(System.in);
        System.out.print("Enter first number: ");
        String num1 = input.nextLine();
        System.out.print("Enter second number: ");
        String num2 = input.nextLine();
        System.out.println("Answer = "+num1+num2);
    }
}
